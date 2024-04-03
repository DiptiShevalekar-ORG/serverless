const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const functions = require('@google-cloud/functions-framework');
const mg = mailgun.client({ username: 'api', key: "process.env.MAILGUN_API_KEY" });
 
const mysql = require('mysql');
 
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.DB_USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});
 
connection.connect(function (err) {
  if (err) {
    console.error('Error connecting to MySQL ---------- ' + err.stack);
    return;
  }
  console.log('Connected to MySQL ----------- ' + connection.threadId);
});
 
functions.cloudEvent('emailVerificationSubscriber', async (cloudEvent) => {
  try {
    const base64name = cloudEvent.data.message.data;
 
    const name = base64name
      ? Buffer.from(base64name, 'base64').toString()
      : 'World';
 
    console.log(name);
 
    const { id, userName } = JSON.parse(name);
 
    const activationLink = `https://diptishevalekar.online/v1/user/verifyaccount?token=${id}`;
 
    const EmailSentTime = new Date();
    
    connection.query('UPDATE users SET EmailSentTime=? WHERE UserName=?',
      [EmailSentTime, userName],
      function (error, results, fields) {
        if (error) throw error;
        console.log('Verification details updated for email --------------', userName);
      });
 
 
    const message = await mg.messages.create('diptishevalekar.online', {
      from: "<mailgun@diptishevalekar.online>",
      to: [userName],
      subject: "Verify your email address",
      text: `Hi ${userName}, Thank you for your interest. Please click on the following link to verify your email address: ${activationLink}`,
      html: `<p>Hello ${userName},Thank you for your interest. Please click on the following link to verify your email address: <a href="${activationLink}">Verify Email</a></p>`
    })
      .then(msg => console.log(msg)) 
      .catch(err => console.log(err));
  } catch (error) {
    console.error(error);
  }
});