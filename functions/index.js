
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {getMessaging} = require("firebase-admin/messaging");
const functions = require("firebase-functions");

initializeApp();

const logger = functions.logger;

exports.onBenefitCreated = onDocumentCreated("benefits/{benefitId}", (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("No data associated with the event");
    return;
  }
  const data = snapshot.data();
  const payload = {
    notification: {
      title: "¡Nuevo Beneficio!",
      body: `${data.supplierName} ha publicado: ${data.title}`,
    },
    topic: "novedades",
  };

  return getMessaging().send(payload)
    .then(() => {
        logger.log("Benefit notification sent.");
    })
    .catch((err) => {
        logger.error("Error sending benefit notification:", err);
    });
});

exports.onAnnouncementCreated = onDocumentCreated("announcements/{announcementId}", (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("No data for the event");
    return;
  }
  const data = snapshot.data();

  const payload = {
    notification: {
      title: "¡Nuevo Anuncio!",
      body: data.title,
    },
    topic: "novedades",
  };

  return getMessaging().send(payload)
      .then(() => {
        logger.log("Announcement notification sent.");
      })
      .catch((err) => {
        logger.error("Error sending announcement notification:", err);
      });
});
