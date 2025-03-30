const nodemailer=require("nodemailer");
require("dotenv").config();

const mailSender=async(email,title,body)=>{
    try {
        // Validate inputs
        if (!email || !title || !body) {
            throw new Error('Email, title, and body are required for sending email');
        }
        
        // Create transporter
        let transporter= nodemailer.createTransport(
            {
                host:process.env.MAIL_HOST,
                auth:{
                    user:process.env.MAIL_USER,
                    pass:process.env.MAIL_PASS
                }
            }
        )
        
        // Send mail
        let info=await transporter.sendMail({
            from:process.env.MAIL_USER || 'AgriLink || AgriLink',
            to:`${email}`,
            subject:`${title}`,
            html:`${body}`
        })
        
        console.log("Email sent successfully:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error in mailSender:", error.message);
        throw error; // Re-throw to allow proper error handling up the chain
    }
}

module.exports=mailSender;