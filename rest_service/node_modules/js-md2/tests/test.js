(function (md2) {
  describe('ascii', function () {
    describe('less than 64 bytes', function () {
      it('should be successful', function () {
        expect(md2('')).to.be('8350e5a3e24c153df2275c9f80692773');
        expect(md2('The quick brown fox jumps over the lazy dog')).to.be('03d85a0d629d2c442e987525319fc471');
        expect(md2('The quick brown fox jumps over the lazy dog.')).to.be('71eaa7e440b611e41a6f0d97384b342a');
      });
    });

    describe('more than 64 bytes', function () {
      it('should be successful', function () {
        expect(md2('The MD5 message-digest algorithm is a widely used cryptographic hash function producing a 128-bit (16-byte) hash value, typically expressed in text format as a 32 digit hexadecimal number. MD5 has been utilized in a wide variety of cryptographic applications, and is also commonly used to verify data integrity.')).to.be('3658f72434eecc8bdb99047f9710c263');
      });
    });
  });

  describe('UTF8', function () {
    describe('less than 64 bytes', function () {
      it('should be successful', function () {
        expect(md2('中文')).to.be('7af93c270b0ec392ca2f0d90a927cf8a');
        expect(md2('aécio')).to.be('628657f2dbd637b6b13500e8567a1c83');
        expect(md2('𠜎')).to.be('434fc70b04f5ce106b1463f2201223a2');
      });
    });

    describe('more than 64 bytes', function () {
      it('should be successful', function () {
        expect(md2('訊息摘要演算法第五版（英語：Message-Digest Algorithm 5，縮寫為MD5），是當前電腦領域用於確保資訊傳輸完整一致而廣泛使用的雜湊演算法之一（又譯雜湊演算法、摘要演算法等），主流程式語言普遍已有MD5的實作。')).to.be('4a0cf02bb374a56e9a9a17e426dee995');
      });
    });
  });
})(md2);
