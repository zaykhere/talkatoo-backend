const uploadToCloudinary = (image) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: 'your_folder_name' }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result.url);
      }
    }).end(image.data);
  });
};

module.exports = uploadToCloudinary;