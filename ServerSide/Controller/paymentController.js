const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../Middleware/catchAsyncErrors');
const Payment = require('../Model/Payment');
const Contract = require('../Model/Contract');
const User = require('../Model/User');
const { createPaymentRequest, verifyPayment, validateWebhookSignature } = require('../utils/instamojoUtils');
const { sendEmail } = require('../utils/mailSender');

/**
 * Create a payment request for a contract
 * @route POST /api/v1/payments/create
 */
exports.createPayment = catchAsyncErrors(async (req, res, next) => {
    try {
        console.log('Payment creation request received:', req.body);
        const { contractId, paymentStage } = req.body;
        
        // Check if contractId and paymentStage are provided
        if (!contractId || !paymentStage) {
            return next(new ErrorHandler('Contract ID and payment stage are required', 400));
        }
        
        // Validate payment stage
        if (!['advance', 'midterm', 'final'].includes(paymentStage)) {
            return next(new ErrorHandler('Invalid payment stage', 400));
        }
        
        // Find the contract
        const contract = await Contract.findById(contractId).populate('farmer buyer');
        
        if (!contract) {
            return next(new ErrorHandler('Contract not found', 404));
        }
        
        // Check if user is the buyer of this contract
        if (contract.buyer._id.toString() !== req.user.id) {
            return next(new ErrorHandler('Only the buyer can make payments for this contract', 403));
        }
        
        // Check if contract is in a valid state for payment
        if (contract.status !== 'payment_pending') {
            return next(new ErrorHandler(`Contract is not in payment_pending state (current: ${contract.status})`, 400));
        }
        
        // Calculate payment amount based on payment stage
        let percentageField;
        let nextStatus;
        
        if (paymentStage === 'advance') {
            percentageField = 'advancePercentage';
            nextStatus = 'active';
        } else if (paymentStage === 'midterm') {
            percentageField = 'midtermPercentage';
            nextStatus = 'harvested';
        } else { // final
            percentageField = 'finalPercentage';
            nextStatus = 'completed';
        }
        
        const percentage = contract.paymentTerms[percentageField];
        const amount = (contract.totalAmount * percentage / 100).toFixed(2);
        
        console.log(`Creating payment for ${paymentStage} stage: ${amount} (${percentage}% of ${contract.totalAmount})`);
        
        // Create a new payment record
        const payment = await Payment.create({
            contract: contractId,
            farmer: contract.farmer._id,
            buyer: contract.buyer._id,
            paymentStage,
            amount,
            percentage,
            status: 'pending',
            description: `${paymentStage.charAt(0).toUpperCase() + paymentStage.slice(1)} payment for contract ${contractId}`
        });
        
        console.log(`Payment record created with ID: ${payment._id}`);
        
        // Create Instamojo payment request
        try {
            const paymentRequestData = {
                purpose: `${paymentStage.charAt(0).toUpperCase() + paymentStage.slice(1)} payment for contract #${contractId.substring(0, 8)}`,
                amount: amount,
                buyer_name: req.user.Name || 'Customer',
                email: req.user.email,
                phone: req.user.contactNumber || '9999999999',
                redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback?paymentId=${payment._id}`,
                webhook: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/v1/payments/webhook`,
                send_email: 'True',
                send_sms: 'True',
                allow_repeated_payments: 'False',
                currency: 'INR'
            };
            
            console.log('Calling Instamojo with payment data:', {
                purpose: paymentRequestData.purpose,
                amount: paymentRequestData.amount,
                redirect_url: paymentRequestData.redirect_url,
                buyer_name: paymentRequestData.buyer_name
            });
            
            const paymentResponse = await createPaymentRequest(paymentRequestData);
            console.log('Received response from Instamojo:', {
                paymentUrl: paymentResponse.paymentUrl,
                paymentRequestId: paymentResponse.paymentRequest.id
            });
            
            // Update payment with Instamojo details
            payment.paymentRequestId = paymentResponse.paymentRequest.id;
            payment.paymentLink = paymentResponse.paymentUrl;
            await payment.save();
            
            // Add payment reference to contract
            if (!contract.payments) {
                contract.payments = { advance: [], midterm: [], final: [] };
            }
            
            contract.payments[paymentStage].push({
                payment: payment._id,
                status: 'pending'
            });
            
            await contract.save();
            
            // Return the payment details and redirection URL
            return res.status(201).json({
                success: true,
                message: 'Payment request created successfully',
                payment: {
                    id: payment._id,
                    amount,
                    stage: paymentStage,
                    status: payment.status
                },
                paymentUrl: paymentResponse.paymentUrl
            });
        } catch (instamojoError) {
            console.error('Error with Instamojo payment creation:', instamojoError);
            
            // Clean up the payment record since Instamojo failed
            await Payment.findByIdAndDelete(payment._id);
            
            // Return a specific error based on the type of failure
            if (instamojoError.statusCode === 503) {
                return next(new ErrorHandler('Payment gateway is currently unavailable. Please try again later.', 503));
            }
            return next(new ErrorHandler(`Payment gateway error: ${instamojoError.message}`, 500));
        }
    } catch (error) {
        console.error('Unhandled error in createPayment:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

/**
 * Handle Instamojo webhook for payment notifications
 * @route POST /api/v1/payments/webhook
 */
exports.handleWebhook = catchAsyncErrors(async (req, res, next) => {
    try {
        const payload = req.body;
        const signature = req.headers['x-instamojo-signature'];
        
        // Validate webhook signature
        const isValid = validateWebhookSignature(payload, signature);
        
        if (!isValid) {
            console.error('Invalid webhook signature');
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }
        
        const paymentRequestId = payload.payment_request_id;
        const paymentId = payload.payment_id;
        const status = payload.status;
        
        // Find the payment by paymentRequestId
        const payment = await Payment.findOne({ paymentRequestId });
        
        if (!payment) {
            console.error(`Payment with request ID ${paymentRequestId} not found`);
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        // Update payment details
        payment.paymentId = paymentId;
        payment.status = status === 'Credit' ? 'completed' : 'failed';
        payment.transactionData = payload;
        
        await payment.save();
        
        // Update contract payment reference
        const contract = await Contract.findById(payment.contract);
        
        if (!contract) {
            console.error(`Contract ${payment.contract} not found`);
            return res.status(404).json({ success: false, message: 'Contract not found' });
        }
        
        // Find and update the payment reference in contract
        const paymentStage = payment.paymentStage;
        const paymentRef = contract.payments[paymentStage].find(
            p => p.payment.toString() === payment._id.toString()
        );
        
        if (paymentRef) {
            paymentRef.status = payment.status;
        }
        
        // If payment is completed, update contract status
        if (payment.status === 'completed') {
            // Determine next status based on payment stage
            let nextStatus;
            
            if (paymentStage === 'advance') {
                nextStatus = 'active';
            } else if (paymentStage === 'midterm') {
                nextStatus = 'harvested';
            } else { // final
                nextStatus = 'completed';
            }
            
            contract.status = nextStatus;
            
            // Notify admin and farmer about the payment
            try {
                const farmer = await User.findById(contract.farmer);
                const buyer = await User.findById(contract.buyer);
                
                // Send notification to admin
                await sendEmail({
                    email: process.env.ADMIN_EMAIL || 'admin@agrolink.com',
                    subject: `New Payment Received: ${paymentStage} payment for Contract ${contract._id}`,
                    message: `
                        <h1>New Payment Received</h1>
                        <p>A ${paymentStage} payment of ₹${payment.amount} has been received for contract ${contract._id}.</p>
                        <p><strong>Payment Details:</strong></p>
                        <ul>
                            <li><strong>Payment ID:</strong> ${payment._id}</li>
                            <li><strong>Transaction ID:</strong> ${payment.paymentId}</li>
                            <li><strong>Amount:</strong> ₹${payment.amount}</li>
                            <li><strong>Percentage:</strong> ${payment.percentage}%</li>
                            <li><strong>Status:</strong> ${payment.status}</li>
                            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                        </ul>
                        <p><strong>Farmer Details:</strong></p>
                        <ul>
                            <li><strong>Name:</strong> ${farmer ? farmer.Name : 'Unknown'}</li>
                            <li><strong>ID:</strong> ${contract.farmer}</li>
                            <li><strong>Email:</strong> ${farmer ? farmer.email : 'Unknown'}</li>
                            <li><strong>Contact:</strong> ${farmer ? farmer.contactNumber : 'Unknown'}</li>
                        </ul>
                        <p><strong>Buyer Details:</strong></p>
                        <ul>
                            <li><strong>Name:</strong> ${buyer ? buyer.Name : 'Unknown'}</li>
                            <li><strong>ID:</strong> ${contract.buyer}</li>
                            <li><strong>Email:</strong> ${buyer ? buyer.email : 'Unknown'}</li>
                            <li><strong>Contact:</strong> ${buyer ? buyer.contactNumber : 'Unknown'}</li>
                        </ul>
                        <p><strong>Contract Details:</strong></p>
                        <ul>
                            <li><strong>Contract ID:</strong> ${contract._id}</li>
                            <li><strong>Crop:</strong> ${contract.crop ? contract.crop.name : 'Unknown'}</li>
                            <li><strong>Total Amount:</strong> ₹${contract.totalAmount}</li>
                            <li><strong>Status:</strong> ${contract.status}</li>
                        </ul>
                        <p>Please disburse this payment to the farmer as soon as possible.</p>
                    `
                });
                
                // Send notification to the farmer
                if (farmer && farmer.email) {
                    await sendEmail({
                        email: farmer.email,
                        subject: `Payment Received: ${paymentStage} payment for your Contract`,
                        message: `
                            <h1>Payment Received</h1>
                            <p>Dear ${farmer.Name},</p>
                            <p>We're pleased to inform you that a ${paymentStage} payment of ₹${payment.amount} has been received for your contract ${contract._id}.</p>
                            <p><strong>Payment Details:</strong></p>
                            <ul>
                                <li><strong>Payment Stage:</strong> ${paymentStage.charAt(0).toUpperCase() + paymentStage.slice(1)}</li>
                                <li><strong>Amount:</strong> ₹${payment.amount}</li>
                                <li><strong>Percentage:</strong> ${payment.percentage}% of total contract value</li>
                                <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
                            </ul>
                            <p><strong>Buyer:</strong> ${buyer ? buyer.Name : 'Unknown'}</p>
                            <p><strong>Contract Status:</strong> Updated to "${nextStatus}"</p>
                            <p>The amount will be disbursed to your registered bank account shortly. You will receive another notification once the amount has been disbursed.</p>
                            <p>Thank you for using AgroLink!</p>
                            <p>Best regards,<br>The AgroLink Team</p>
                        `
                    });
                }
            } catch (emailError) {
                console.error('Error sending notification emails:', emailError);
            }
        }
        
        await contract.save();
        
        return res.status(200).json({ success: true });
        
    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Verify payment status after redirect from Instamojo
 * @route GET /api/v1/payments/:id/verify
 */
exports.verifyPayment = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { payment_request_id } = req.query;
        
        // Find the payment
        const payment = await Payment.findById(id);
        
        if (!payment) {
            return next(new ErrorHandler('Payment not found', 404));
        }
        
        // Check if payment is already completed or failed
        if (['completed', 'failed'].includes(payment.status)) {
            return res.status(200).json({
                success: true,
                payment: {
                    id: payment._id,
                    status: payment.status,
                    amount: payment.amount,
                    stage: payment.paymentStage
                }
            });
        }
        
        // Verify payment status with Instamojo - use payment_request_id from query if available
        const paymentRequestId = payment_request_id || payment.paymentRequestId;
        const paymentStatus = await verifyPayment(paymentRequestId, payment.paymentId);
        
        // Update payment status
        if (paymentStatus.status === 'Completed' || paymentStatus.payment?.status === 'Credit') {
            payment.status = 'completed';
            payment.verificationData = paymentStatus;
            
            // Update contract payment reference
            const contract = await Contract.findById(payment.contract);
            
            if (contract) {
                // Find and update the payment reference in contract
                const paymentStage = payment.paymentStage;
                const paymentRef = contract.payments[paymentStage].find(
                    p => p.payment.toString() === payment._id.toString()
                );
                
                if (paymentRef) {
                    paymentRef.status = 'completed';
                }
                
                // If payment is completed, update contract status
                if (payment.status === 'completed') {
                    // Determine next status based on payment stage
                    let nextStatus;
                    
                    if (paymentStage === 'advance') {
                        nextStatus = 'active';
                    } else if (paymentStage === 'midterm') {
                        nextStatus = 'harvested';
                    } else { // final
                        nextStatus = 'completed';
                    }
                    
                    contract.status = nextStatus;
                }
                
                await contract.save();
            }
        } else {
            payment.status = 'failed';
            payment.verificationData = paymentStatus;
        }
        
        await payment.save();
        
        return res.status(200).json({
            success: true,
            payment: {
                id: payment._id,
                status: payment.status,
                amount: payment.amount,
                stage: payment.paymentStage
            }
        });
        
    } catch (error) {
        console.error('Error verifying payment:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

/**
 * Get payment details
 * @route GET /api/v1/payments/:id
 */
exports.getPaymentDetails = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Find the payment
        const payment = await Payment.findById(id);
        
        if (!payment) {
            return next(new ErrorHandler('Payment not found', 404));
        }
        
        // Check if user is authorized to view this payment
        if (
            payment.farmer.toString() !== req.user.id && 
            payment.buyer.toString() !== req.user.id && 
            req.user.userType !== 'admin'
        ) {
            return next(new ErrorHandler('You are not authorized to view this payment', 403));
        }
        
        return res.status(200).json({
            success: true,
            payment
        });
        
    } catch (error) {
        console.error('Error getting payment details:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

/**
 * List payments for a contract
 * @route GET /api/v1/contracts/:id/payments
 */
exports.getContractPayments = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Find the contract
        const contract = await Contract.findById(id);
        
        if (!contract) {
            return next(new ErrorHandler('Contract not found', 404));
        }
        
        // Check if user is authorized to view this contract's payments
        if (
            contract.farmer.toString() !== req.user.id && 
            contract.buyer.toString() !== req.user.id && 
            req.user.userType !== 'admin'
        ) {
            return next(new ErrorHandler('You are not authorized to view this contract\'s payments', 403));
        }
        
        // Get all payments for this contract
        const payments = await Payment.find({ contract: id }).sort({ createdAt: -1 });
        
        return res.status(200).json({
            success: true,
            count: payments.length,
            payments
        });
        
    } catch (error) {
        console.error('Error getting contract payments:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

/**
 * Mark payment as disbursed (admin only)
 * @route PUT /api/v1/payments/:id/disburse
 */
exports.markAsDisbursed = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        
        // Check if user is admin
        if (req.user.userType !== 'admin') {
            return next(new ErrorHandler('Only admins can mark payments as disbursed', 403));
        }
        
        // Find the payment
        const payment = await Payment.findById(id);
        
        if (!payment) {
            return next(new ErrorHandler('Payment not found', 404));
        }
        
        // Check if payment is completed
        if (payment.status !== 'completed') {
            return next(new ErrorHandler('Only completed payments can be marked as disbursed', 400));
        }
        
        // Update payment
        payment.disbursed = true;
        payment.disbursedAt = Date.now();
        payment.disbursedBy = req.user.id;
        payment.status = 'disbursed';
        
        if (notes) {
            payment.adminNotes = notes;
        }
        
        await payment.save();
        
        // Get additional details needed for emails
        const contract = await Contract.findById(payment.contract);
        const buyer = await User.findById(payment.buyer);
        const admin = await User.findById(req.user.id);
        
        // Send confirmation to admin
        try {
            await sendEmail({
                email: req.user.email || process.env.ADMIN_EMAIL || 'admin@agrolink.com',
                subject: `Disbursement Confirmed: ${payment.paymentStage} payment for Contract ${payment.contract}`,
                message: `
                    <h1>Disbursement Confirmed</h1>
                    <p>You have successfully disbursed the ${payment.paymentStage} payment of ₹${payment.amount} for contract ${payment.contract}.</p>
                    <p><strong>Disbursement Details:</strong></p>
                    <ul>
                        <li><strong>Payment ID:</strong> ${payment._id}</li>
                        <li><strong>Payment Stage:</strong> ${payment.paymentStage.charAt(0).toUpperCase() + payment.paymentStage.slice(1)}</li>
                        <li><strong>Amount:</strong> ₹${payment.amount}</li>
                        <li><strong>Disbursed On:</strong> ${new Date(payment.disbursedAt).toLocaleString()}</li>
                        <li><strong>Disbursed By:</strong> ${admin ? admin.Name : req.user.id}</li>
                    </ul>
                    <p><strong>Farmer Details:</strong></p>
                    <ul>
                        <li><strong>Name:</strong> ${farmer ? farmer.Name : 'Unknown'}</li>
                        <li><strong>ID:</strong> ${payment.farmer}</li>
                        <li><strong>Email:</strong> ${farmer ? farmer.email : 'Unknown'}</li>
                    </ul>
                    <p><strong>Buyer Details:</strong></p>
                    <ul>
                        <li><strong>Name:</strong> ${buyer ? buyer.Name : 'Unknown'}</li>
                        <li><strong>ID:</strong> ${payment.buyer}</li>
                        <li><strong>Email:</strong> ${buyer ? buyer.email : 'Unknown'}</li>
                    </ul>
                    <p><strong>Contract Details:</strong></p>
                    <ul>
                        <li><strong>Contract ID:</strong> ${payment.contract}</li>
                        <li><strong>Crop:</strong> ${contract?.crop?.name || 'Unknown'}</li>
                        <li><strong>Total Amount:</strong> ₹${contract?.totalAmount || 'Unknown'}</li>
                        <li><strong>Current Status:</strong> ${contract?.status || 'Unknown'}</li>
                    </ul>
                    ${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ''}
                    <p>The farmer has been notified of this disbursement.</p>
                `
            });
        } catch (emailError) {
            console.error('Error sending admin confirmation email:', emailError);
        }
        
        // Notify farmer of disbursement
        const farmer = await User.findById(payment.farmer);
        
        if (farmer && farmer.email) {
            try {
                // Get contract details for the notification email
                // (Contract details are already fetched above)
                
                await sendEmail({
                    email: farmer.email,
                    subject: `Payment Disbursed: ${payment.paymentStage} payment for Contract ${payment.contract}`,
                    message: `
                        <h1>Payment Disbursed</h1>
                        <p>Dear ${farmer.Name},</p>
                        <p>Your ${payment.paymentStage} payment of ₹${payment.amount} for contract ${payment.contract} has been disbursed to your account.</p>
                        <p><strong>Disbursement Details:</strong></p>
                        <ul>
                            <li><strong>Payment ID:</strong> ${payment._id}</li>
                            <li><strong>Payment Stage:</strong> ${payment.paymentStage.charAt(0).toUpperCase() + payment.paymentStage.slice(1)}</li>
                            <li><strong>Amount:</strong> ₹${payment.amount}</li>
                            <li><strong>Percentage:</strong> ${payment.percentage}% of contract value</li>
                            <li><strong>Disbursed On:</strong> ${new Date(payment.disbursedAt).toLocaleString()}</li>
                        </ul>
                        <p><strong>Contract Details:</strong></p>
                        <ul>
                            <li><strong>Contract ID:</strong> ${payment.contract}</li>
                            <li><strong>Crop:</strong> ${contract?.crop?.name || 'Unknown'}</li>
                            <li><strong>Total Amount:</strong> ₹${contract?.totalAmount || 'Unknown'}</li>
                            <li><strong>Current Status:</strong> ${contract?.status || 'Unknown'}</li>
                        </ul>
                        <p>Please check your registered bank account for the transaction. If you don't receive the amount within 2-3 business days, please contact our support team.</p>
                        <p>Thank you for using AgroLink!</p>
                        <p>Best regards,<br>The AgroLink Team</p>
                    `
                });
            } catch (emailError) {
                console.error('Error sending disbursement notification email:', emailError);
            }
        }
        
        return res.status(200).json({
            success: true,
            message: 'Payment marked as disbursed',
            payment: {
                id: payment._id,
                status: payment.status,
                disbursedAt: payment.disbursedAt
            }
        });
        
    } catch (error) {
        console.error('Error marking payment as disbursed:', error);
        return next(new ErrorHandler(error.message, 500));
    }
}); 