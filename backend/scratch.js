import cloudinary from "./src/lib/cloudinary.js";

const pdfDataUri = "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwAAAq3wXqCmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKMzIKZW5kb2JqCgoxIDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1IDg0Ml0vUGFyZW50IDQgMCBSL1Jlc291cmNlczw8Pj4vQ29udGVudHMgMiAwIFI+PgplbmRvYmoKCjQgMCBvYmoKPDwvVHlwZS9QYWdlcy9NZWRpYUJveFswIDAgNTk1IDg0Ml0vS2lkc1sxIDAgUl0vQ291bnQgMT4+CmVuZG9iagoKNSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNCAwIFI+PgplbmRvYmoKCjYgMCBvYmoKPDwvUHJvZHVjZXIoZ2hvc3RzY3JpcHQpL0NyZWF0aW9uRGF0ZShEOjIwMjEwMTAxMDAwMDAwWik+PgplbmRvYmoKCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDE1MiAwMDAwMCBuIAowMDAwMDAwMDE5IDAwMDAwIG4gCjAwMDAwMDAxMzMgMDAwMDAgbiAKMDAwMDAwMDI1MSAwMDAwMCBuIAowMDAwMDAwMzM0IDAwMDAwIG4gCjAwMDAwMDAzODIgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDcvUm9vdCA1IDAgUi9JbmZvIDYgMCBSPj4Kc3RhcnR4cmVmCjQ2MwolJUVPRgo=";

async function test() {
  try {
    let res = await cloudinary.uploader.upload(pdfDataUri, { resource_type: "raw", public_id: "test-doc.pdf" });
    console.log("Success RAW with public_id:", res.secure_url);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
