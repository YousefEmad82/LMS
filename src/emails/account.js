const sgMail = require('@sendgrid/mail')
const sendEmail = (to,subject,text)=>{
const sendgridApiKey = "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"
sgMail.setApiKey(sendgridApiKey)
sgMail.send({
    to : to,
    from : '1601738@eng.asu.edu.eg',
    subject : subject,
    text : text,

}).then(() => {
    console.log('Email sent')
  }).catch((error) => {
    console.error(error.message)
  })

}
module.exports = sendEmail