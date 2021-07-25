const AWS = require('aws-sdk')
const path = require('path')


// AKIA467JHLURGMEOC5PL
// ZxaQK3qbnmbo+ZWA+BvWEYzKxkNiYosLEMx5KtLp

const aws_upload = async function(body,name,code){
AWS.config.update({
    accessKeyId: "AKIA467JHLURGQMQ3AEC",
    secretAccessKey: "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"
  })

  var s3 = new AWS.S3()
  //var filePath = "./data/file.txt"
  var params = {
    Bucket: 'asu-lms2',
    Body :body ,
    Key : "uploads/"+Date.now()+"_"+path.basename(name+"_"+code)+ ".pdf"
  }
  try{
  const data = await s3.upload(params).promise()
  return data
  }catch(e){
      return e
  }
}

const aws_get = async function(key){
  AWS.config.update({
    accessKeyId: "AKIA467JHLURGQMQ3AEC",
    secretAccessKey: "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"
    })
  
    var s3 = new AWS.S3()
    //var filePath = "./data/file.txt"
    // var params = {
    //   Bucket: 'asu-lms',
    //   Body :body ,
    //   Key : "uploads/"+Date.now()+"_"+path.basename(name+"_"+code)+ ".pdf"
    // }
    try{
    const data = await s3.getObject(key).promise()
    return data
    }catch(e){
        return e
    }
  }

  const aws_generateUrl = async function(key){
  AWS.config.update({
    accessKeyId: "AKIA467JHLURGQMQ3AEC",
    secretAccessKey: "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",
    signatureVersion: 'v4',

  })
var s3 = new AWS.S3()
var params = {Bucket: 'asu-lms2', Key:key,Expires : 10*60}
var url = s3.getSignedUrl('getObject', params)
return url
}
   
module.exports = {aws_upload,aws_get,aws_generateUrl}