import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";

let isOpenCVLoaded = false;
let openCVLoadCallbacks = [];
function handleOpenCVLoaded() {
  isOpenCVLoaded = true;
  openCVLoadCallbacks.forEach((cb) => cb());
  openCVLoadCallbacks = [];
}
function ensureOpenCVScriptLoaded() {
  if (
    !isOpenCVLoaded &&
    typeof document !== "undefined" &&
    !document.getElementById("opencv-script")
  ) {
    const script = document.createElement("script");
    script.id = "opencv-script";
    script.src =
      "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.7.0-release.1/dist/opencv.js";
    script.async = true;
    script.onload = handleOpenCVLoaded;
    document.head.appendChild(script);
  }
}

function resizeImage(imgElement, maxDim = 1200) {
  const canvas = document.createElement("canvas");
  let { width, height } = imgElement;
  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgElement, 0, 0, width, height);
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(URL.createObjectURL(blob)),
      "image/jpeg",
      0.9
    );
  });
}

const ImageAligner = forwardRef(function ImageAligner(
  { firstImageUrl, currentImageUrl, onProcessed },
  ref
) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("대기 중");
  const [priority, setPriority] = useState("background");
  const isProcessing = useRef(false);
  const processTimeoutRef = useRef(null);
  const workerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    setPriorityMode: (mode) => setPriority(mode),
    getStatus: () => status,
    isProcessing: () => isProcessing.current,
    abort: () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        isProcessing.current = false;
        setStatus("처리 중단됨");
      }
    },
  }));

  useEffect(() => {
    ensureOpenCVScriptLoaded();
    startProcessing();
    return () => {
      if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [firstImageUrl, currentImageUrl]);

  useEffect(() => {
    if (priority === "foreground" && !isProcessing.current) {
      if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
      startImageProcessing();
    }
  }, [priority]);

  const startProcessing = () => {
    if (isProcessing.current) return;
    if (priority === "foreground") {
      startImageProcessing();
    } else {
      processTimeoutRef.current = setTimeout(startImageProcessing, 300);
    }
  };

  const startImageProcessing = async () => {
    if (!firstImageUrl || !currentImageUrl) {
      onProcessed && onProcessed(null);
      return;
    }

    // 분석 강제 진행 (같은 URL이어도)
    if (firstImageUrl === currentImageUrl) {
      console.warn(
        "⚠️ 기준 이미지와 선택 이미지가 같습니다. 분석을 진행합니다."
      );
    }
    if (!isOpenCVLoaded) {
      openCVLoadCallbacks.push(() => startImageProcessing());
      return;
    }

    isProcessing.current = true;
    setStatus("이미지 로드 중...");
    try {
      const [img1, img2] = await Promise.all([
        loadImage(firstImageUrl),
        loadImage(currentImageUrl),
      ]);
      const [resized1, resized2] = await Promise.all([
        resizeImage(img1),
        resizeImage(img2),
      ]);
      const [img1r, img2r] = await Promise.all([
        loadImage(resized1),
        loadImage(resized2),
      ]);
      await processWithWorker(img1r, img2r);
      URL.revokeObjectURL(resized1);
      URL.revokeObjectURL(resized2);
    } catch (e) {
      console.error("처리 오류", e);
      setStatus("오류: " + e.message);
      isProcessing.current = false;
      onProcessed && onProcessed(null);
    }
  };

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("이미지 로드 실패: " + src));
      img.src = src;
    });

  const processWithWorker = (img1, img2) =>
    new Promise((resolve, reject) => {
      const canvas1 = document.createElement("canvas");
      const canvas2 = document.createElement("canvas");
      canvas1.width = img1.width;
      canvas1.height = img1.height;
      canvas2.width = img2.width;
      canvas2.height = img2.height;
      const ctx1 = canvas1.getContext("2d");
      const ctx2 = canvas2.getContext("2d");
      ctx1.drawImage(img1, 0, 0);
      ctx2.drawImage(img2, 0, 0);
      const imageData1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
      const imageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);

      const code = `
self.importScripts('https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.7.0-release.1/dist/opencv.js');

function waitForCV() {
    return new Promise(resolve => {
        const check = () => (typeof cv !== 'undefined' && cv.Mat) ? resolve() : setTimeout(check, 100);
        check();
    });
}

self.onmessage = async ({ data }) => {
    await waitForCV();
    const { img1Data, img2Data, width, height } = data;

    // 1. ImageData → Mat
    let mat1 = cv.matFromImageData(new ImageData(new Uint8ClampedArray(img1Data), width, height));
    let mat2 = cv.matFromImageData(new ImageData(new Uint8ClampedArray(img2Data), width, height));

    // 2. (옵션) 해상도 축소
    if (width * height > 1024 * 1024) {
        const newW = Math.round(width * 0.75);
        const newH = Math.round(height * 0.75);
        const tmp1 = new cv.Mat(), tmp2 = new cv.Mat();
        cv.resize(mat1, tmp1, new cv.Size(newW, newH));
        cv.resize(mat2, tmp2, new cv.Size(newW, newH));
        mat1.delete(); mat2.delete();
        mat1 = tmp1; mat2 = tmp2;
    }

    // 3. 그레이 변환 및 이진화
    const gray1 = new cv.Mat(), gray2 = new cv.Mat();
    cv.cvtColor(mat1, gray1, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(mat2, gray2, cv.COLOR_RGBA2GRAY);

    const bin1 = new cv.Mat(), bin2 = new cv.Mat();
    cv.threshold(gray1, bin1, 60, 255, cv.THRESH_BINARY_INV);
    cv.threshold(gray2, bin2, 60, 255, cv.THRESH_BINARY_INV);

    // 4. 기준 이미지에 없고 현재 이미지에만 있는 부분
    const newOnly = new cv.Mat();
    cv.bitwise_and(bin2, cv.bitwise_not(bin1), newOnly);

    // 5. 노이즈 제거
    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    cv.morphologyEx(newOnly, newOnly, cv.MORPH_OPEN, kernel);
    kernel.delete();

    // 6. 빨간색 덧입히기
    const result = mat2.clone();
    for (let y = 0; y < newOnly.rows; y++) {
        for (let x = 0; x < newOnly.cols; x++) {
            if (newOnly.ucharPtr(y, x)[0] > 0) {
                const p = result.ucharPtr(y, x);
                p[0] = 255; // R
                p[1] = 0;   // G
                p[2] = 0;   // B
                p[3] = 255; // A
            }
        }
    }

    // 7. 결과 전송
    const out = new Uint8ClampedArray(result.data);
    self.postMessage(
        { success: true, result: { width: result.cols, height: result.rows, data: out.buffer } },
        [out.buffer]
    );

    // 8. 메모리 정리
    mat1.delete(); mat2.delete();
    gray1.delete(); gray2.delete();
    bin1.delete(); bin2.delete();
    newOnly.delete(); result.delete();
};
`;

      const blob = new Blob([code], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { success, result, error } = e.data;
        if (success && result) {
          const canvas = canvasRef.current;
          canvas.width = result.width;
          canvas.height = result.height;
          const ctx = canvas.getContext("2d");
          const imageData = new ImageData(
            new Uint8ClampedArray(result.data),
            result.width,
            result.height
          );
          ctx.putImageData(imageData, 0, 0);
          onProcessed && onProcessed(canvas.toDataURL("image/png"));
          setStatus("처리 완료");
          isProcessing.current = false;
          resolve();
        } else if (error) {
          reject(new Error(error));
        }
        worker.terminate();
        URL.revokeObjectURL(url);
      };

      worker.onerror = (e) => {
        reject(new Error("Worker 오류: " + e.message));
        worker.terminate();
        URL.revokeObjectURL(url);
      };

      worker.postMessage(
        {
          img1Data: imageData1.data.buffer, // Pass ArrayBuffer for transferability
          img2Data: imageData2.data.buffer, // Pass ArrayBuffer for transferability
          width: img1.width,
          height: img1.height,
        },
        [imageData1.data.buffer, imageData2.data.buffer]
      ); // Transferable objects
    });

  return (
    <div style={{ display: "none" }}>
      <canvas ref={canvasRef} width="800" height="600" />
    </div>
  );
});

export default ImageAligner;
