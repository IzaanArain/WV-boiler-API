const { default: axios } = require("axios");
var serverKey = "AAAA_FtHB9E:APA91bE1Skkmp4qjde4V4JuppXxtMMwxcmPLkhczkfN6G-YUECeZGujQFOkdnDX973yRNM3juAWem-6lFYnT3oMW1wFwpxYAXW15FXylAh_kbRRIS-rNWvksV4apJkSuoqkK8PjrCH1a"; //put your server key here

const pushNotifications = async (payload) => {
    try {
         const response = await axios.post('https://fcm.googleapis.com/fcm/send', payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `key=${serverKey}`,
            },
        });
        console.log('Notification sent successfully:', response.data);
        console.log(JSON.stringify(payload.data))
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};


module.exports = { pushNotifications } 
