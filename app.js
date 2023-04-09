const {google} = require('googleapis');
const {authorize} = require('./utils');

const LABEL_NAME = 'Auto Responder';
const AUTO_REPLY_SUBJECT = 'I am on vacation';
const AUTO_REPLY_BODY = 'Hello,\n\nI am currently on vacation and will respond to your email when I return.\n\nBest regards,\nYour Name';

async function main() {
  const auth = await authorize();

  const gmail = google.gmail({version: 'v1', auth});

  const labelId = await getOrCreateLabel(gmail, LABEL_NAME);

  setInterval(async () => {
    const messages = await getUnrepliedMessages(gmail);

    for (const message of messages) {
      await sendAutoReply(gmail, message, AUTO_REPLY_SUBJECT, AUTO_REPLY_BODY);
      await applyLabelToMessage(gmail, message.id, labelId);
    }
  }, getRandomInt(45000, 120000));
}

async function getOrCreateLabel(gmail, labelName) {
  const {data: {labels}} = await gmail.users.labels.list({userId: 'me'});

  const existingLabel = labels.find(label => label.name === labelName);

  if (existingLabel) {
    return existingLabel.id;
  }

  const {data: newLabel} = await gmail.users.labels.create({
    userId: 'me',
    requestBody: {
      name: labelName,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show'
    }
  });

  return newLabel.id;
}

async function getUnrepliedMessages(gmail) {
  const {data: {messages}} = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread -label:' + LABEL_NAME
  });

  return messages || [];
}

async function sendAutoReply(gmail, message, subject, body) {
    const messageData = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
    });
  
    const fromHeader = messageData.data.payload.headers.find(
      (header) => header.name === 'From'
    );
  
    if (!fromHeader) {
      console.error('Unable to find sender email address');
      return;
    }
  
    const email = [
      'To: ' + fromHeader.value,
      'Subject: ' + subject,
      '',
      body,
    ].join('\n');
  
    const raw = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });
  }
  

async function applyLabelToMessage(gmail, messageId, labelId) {
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      addLabelIds: [labelId]
    }
  });
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

main().catch(console.error);
