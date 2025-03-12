import axios from "axios";
export const axiosInstance = axios.create({});

export default function apiconnector(method, url, bodyData, header, params) {
  return (
    console.log("url", url),
    axiosInstance({
      method: `${method}`,
      url: `${url}`,
      data: bodyData ? bodyData : null,
      headers: header ? header : null,
      params: params ? params : null,
    })
  );
}
