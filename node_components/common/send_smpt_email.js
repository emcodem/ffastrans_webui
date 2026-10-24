const nodemailer = require("nodemailer");
const axios = require('axios');

module.exports = {
	send: send
}

/* throws exception! uses ffastrans smtp config to send mail */
async function send(rcpt,subject, body){
		
	//refresh install info
	var about_url = ("http://" + global.config["STATIC_API_HOST"] + ":" + global.config["STATIC_API_PORT"] + "/api/json/v2/about");
	console.log("retrieving ffastrans about api",about_url);
	try{
		var resp = await axios.get(about_url);
		console.log("about api response",resp.data);
		global["ffastrans-about"] = resp.data;
	}catch(ex){
		//could not refresh, use last known config
	}
	
	//send the mail
	return await _send_internal(rcpt,subject, body);
}

/* RC4, as ffastrans encrypts the smtp password with it. crypto.createDecipheriv("RC4") fails since node 17 (OpenSSL 3 legacy algorithm) */
function rc4(key, data){
	var s = new Uint8Array(256);
	for (var i = 0; i < 256; i++)
		s[i] = i;
	for (var i = 0, j = 0; i < 256; i++){
		j = (j + s[i] + key[i % key.length]) & 255;
		[s[i], s[j]] = [s[j], s[i]];
	}
	var out = Buffer.alloc(data.length);
	for (var n = 0, i = 0, j = 0; n < data.length; n++){
		i = (i + 1) & 255;
		j = (j + s[i]) & 255;
		[s[i], s[j]] = [s[j], s[i]];
		out[n] = data[n] ^ s[(s[i] + s[j]) & 255];
	}
	return out;
}

async function _send_internal(rcpt,subject, body){
	var ec =  global["ffastrans-about"]["about"]["email"];
	console.log("Sendmail config:",ec)
	var crypto = require('crypto');
	const hash = crypto.createHash('MD5').update("CHKSUM280873").digest(); //create crypto hash out of static secret word
	var decoded_pwd = rc4(hash, Buffer.from(ec["password"], "hex"));
	  let transporter = nodemailer.createTransport({
		host: ec ["server"],
		port: ec ["port"],
		//secure: true, // true for 465, false for other ports
		auth: {
		  user: ec["username"], // generated ethereal user
		  pass: decoded_pwd, // generated ethereal password
		},
		requireTLS: ec["ssl"],
		tls: {
			maxVersion: 'TLSv1.3',
			minVersion: 'TLSv1.2',
			rejectUnauthorized: false,
			ciphers:'SSLv3'
		}
	  });
	let info = await transporter.sendMail({
		from: ec["from"], // sender address
		to: rcpt, // list of receivers
		subject: subject, // Subject line
		html: body + "\n" + ec["signature"], // html body
	  });
	return info;
	
}