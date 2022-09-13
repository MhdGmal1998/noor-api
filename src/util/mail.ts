import nodemailer from "nodemailer"
import dotenv from "dotenv"
import path from "path"
import Log from "./Log"
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") })

const fromMail = process.env.RESET_PASSWORD_ADDRESS

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: fromMail,
    pass: process.env.RESET_PASSWORD_PW,
  },
})

// transporter.sendMail(mailOptions, function(error, info){
// if (error) {
// console.log(error);
// } else {
// console.log('Email sent: ' + info.response);
// }
// });

export const mail = async (to: string, subject: string, text: string) => {
  const mailOptions = {
    from: fromMail,
    to,
    subject,
    text,
  }
  const response = await transporter.sendMail(mailOptions)
  Log.debug("MAIL SENT")
  console.log(response)
}
