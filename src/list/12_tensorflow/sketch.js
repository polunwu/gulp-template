window.addEventListener('load', () => {
  let net;
  const imgUpload = document.getElementById('img-upload');
  const img = document.getElementById('image');
  const loading = document.querySelector('.loading');
  const canvas = document.getElementById('canvas');
  const outputImg = document.getElementById('output-img');
  const startBtn = document.getElementById('start-btn');

  const modelConfig = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 0.75,
    quantBytes: 2,
  };

  function setLoadingMsg(msg) {
    if (typeof msg !== 'string') return;
    loading.innerHTML = msg;
  }

  async function loadBodyPix() {
    net = await bodyPix.load(modelConfig);

    /**
     * One of (see documentation below):
     *   - net.segmentPerson
     *   - net.segmentPersonParts
     *   - net.segmentMultiPerson
     *   - net.segmentMultiPersonParts
     * See documentation below for details on each method.
     */
    console.log(net);
    setLoadingMsg('finish Loading Model');
    imgUpload.classList.remove('hide');
    img.classList.remove('hide');
  }

  async function predict() {
    const segmentation = await net.segmentPerson(img, {
      flipHorizontal: false,
      internalResolution: 'high',
      segmentationThreshold: 0.3,
      maxDetections: 10,
      scoreThreshold: 0.4,
      nmsRadius: 20,
    });
    setLoadingMsg('...segmentPerson complete');
    console.log(segmentation);

    const maskBackground = true;
    // Convert the segmentation into a mask to darken the background.
    const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const backgroundColor = { r: 255, g: 0, b: 0, a: 255 };
    const backgroundDarkeningMask = bodyPix.toMask(
      segmentation,
      foregroundColor,
      backgroundColor
    );

    const opacity = 1;
    const maskBlurAmount = 0;
    const flipHorizontal = false;
    // Draw the mask onto the image on a canvas.  With opacity set to 0.7 and
    // maskBlurAmount set to 3, this will darken the background and blur the
    // darkened background's edge.
    bodyPix.drawMask(
      canvas,
      img,
      backgroundDarkeningMask,
      opacity,
      maskBlurAmount,
      flipHorizontal
    );

    setLoadingMsg('...Loading Jimp');
    const originImg = img.src;
    const jimp = await Jimp.read(originImg);
    setLoadingMsg('...finish Jimp');

    let count = 0;
    for (let i = 0; i < segmentation.height; i++) {
      for (let j = 0; j < segmentation.width; j++) {
        if (segmentation.data[count] === 0) {
          jimp.setPixelColor(0x00000000, j, i);
        }
        count++;
      }
    }

    const outputSrc = await jimp.getBase64Async(Jimp.MIME_PNG);
    outputImg.src = outputSrc;
  }

  // 載入 BodyPix 模型
  loadBodyPix();

  // 開始去背
  startBtn.addEventListener('click', () => {
    setLoadingMsg('...Loading segmentPerson');
    startBtn.disabled = true;

    setTimeout(() => {
      predict();
    }, 0); // 奇怪！避免上方 DOM Manipulate 被 BLOCK
  });

  // 載入圖片
  imgUpload.addEventListener('change', previewFile);

  function previewFile() {
    startBtn.disabled = false;
    var file = imgUpload.files[0];
    var reader = new FileReader();

    reader.addEventListener(
      'load',
      async function () {
        const rawImg = await Jimp.read(reader.result);

        // 取得方向，欲旋轉角度 from utils.js
        const orientation = getOrientation(reader.result);
        const deg = convertRotationToDegrees(orientation);
        // console.log(deg);

        // 旋轉，壓縮
        await rawImg.rotate(deg).resize(375, Jimp.AUTO);

        // 寫入 img tag
        let imgType = rawImg.getExtension().toLowerCase(); // png/jpg
        img.src = await rawImg.getBase64Async(`image/${imgType}`);
        startBtn.classList.remove('hide');

        setLoadingMsg('finish Loading Image');
      },
      false
    );

    if (file) {
      setLoadingMsg('...Loading Image');
      reader.readAsArrayBuffer(file);
    }
  }
});
