import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function test() {
  try {
    const dataUri = "data:application/zip;base64,UEsDBAoAAAAAADxrA0QAAAAAAAAAAAAAAAAIABAAZHVtbXkudHh0VVgMAAAAsDZiW7A2Ylt1eAsAAQToAwAABOgDAABQSwcIAAAAAAIAAAAAUEsBAhQDFAAAAAAAPGsDRAAAAAACAAAAAAAAAAgAIAAAAAAAgAAAAAAAAGR1bW15LnR4dFVYCAAAALA2YluwNmJbdXgLAAEE6AMAAAToAwAAUEsFBgAAAAABAAEATgAAAEsAAAAAAA==";
    const res = await cloudinary.uploader.upload(dataUri, { resource_type: "raw" });
    console.log("RAW ZIP URL:", res.secure_url);
  } catch (e) {
    console.error(e);
  }
}
test();
