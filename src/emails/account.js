const sgMail = require('@sendgrid/mail')
const sendEmail = (to,subject,text)=>{
const sendgridApiKey = "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"
sgMail.setApiKey(sendgridApiKey)
sgMail.send({
    to : to,
    from : '1601727@eng.asu.edu.eg',
    subject : subject,
    text : text,

}).then(() => {
    console.log('Email sent')
  }).catch((error) => {
    console.error(error.message)
  })

}
module.exports = sendEmail