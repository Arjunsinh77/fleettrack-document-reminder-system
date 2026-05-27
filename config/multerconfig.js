const multer=require('multer');

const crypto=require('crypto');

const path=require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/img/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    crypto. randomBytes (12,function (err, bytes){
    const fn=bytes.toString('hex') +path.extname(file.originalname) ; 
    cb(null, fn)
});
    
  }
})
const upload = multer({ storage: storage })

module.exports=upload;