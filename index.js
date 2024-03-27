const functions = require('@google-cloud/functions-framework');

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mysql = require("mysql");
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});

const pool = mysql.createPool({
  HOST: process.env.HOST,
  DB_USERNAME: process.env.DB_USERNAME,
  PASSWORD: process.env.PASSWORD,
  DATABASE: process.env.DATABASE,
});

functions.cloudEvent('emailVerificationSubscriber', async (cloudEvent) => {
  
    const base64name = JSON.parse(Buffer.from(cloudEvent.data.message.data, 'base64').toString())
console.log(`${base64name}`)
   //const {id, UserName, timestamp} = base64name;


   const UserName = base64name["UserName"];
   const id = base64name["id"];
   const timestamp = base64name["timestamp"];

   const updateusers = {
    id: base64name["id"],
    timestamp: new Date().toISOString().slice(0,19).replace('T',' '),
   }

   try {
    const queryPromise = new Promise((resolve, reject) => {
      pool.query(
        "INSERT INTO users SET ?",
        updateusers,
        (error, results, fields) => {
          if (error) {
            console.error(error);
            reject(error);
          }
          console.log("Inserted " + results.affectedRows + " row(s).");
          resolve();
        }
      );
    });
    await queryPromise;


   console.log(`${id} this is the timestamp${timestamp}`);
  // const verificationLink = `http://localhost:3002/v1/user/verifyaccount?token=${id}&timestamp=${timestamp}`;


    const msg = await mg.messages.create('diptishevalekar.online', {
      from: "<mailgun@diptishevalekar.online>",
      to: ["shevalekar.d@northeastern.edu"],
      subject: "Please verify you email id",
      text: `Hello ${UserName},

      Welcome to the website!

      Thank you for your interest. Please click on the following link to verify your email address: ${process.env.WEBAPP_URL}?id=${id}&timestamp=${timestamp}
      
      Best Regards`,
      html: `<p>Hello ${UserName},</p>

      <p>Welcome to the website!</p>

      <p>Thank you for your interest. Please click on the following link to verify your email address: ${process.env.WEBAPP_URL}?id=${id}&timestamp=${timestamp}</p>
      
      <p>Best Regards</p>`
    });

    console.log(msg); 
  } catch (error) {
    console.error(error);
  }
});