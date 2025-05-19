import React, { useState } from "react";
import styles from "./ImageCard.module.css";
import ImagePopup from "./ImagePopup";

/**
 * 이미지 갤러리 컴포넌트
 *
 * 이미지 목록을 표시하고 이미지 클릭 시 팝업을 띄우는 컴포넌트입니다.
 */
export default function ImageGallery({
  images,
  loading,
  error,
  buildingId,
  buildingImages,
  validateImageUrl,
}) {
  const [selectedImage, setSelectedImage] = useState(null);

  // 이미지 클릭 핸들러
  const handleImageClick = (image, index) => {
    const imageUrl =
      typeof image === "string"
        ? image
        : validateImageUrl(image.url || image.imageUrl);

    // 첫 관측 이미지 찾기
    let firstImageUrl = null;
    if (buildingImages && buildingImages.length > 0) {
      // 같은 웨이포인트의 가장 오래된 이미지 찾기
      const waypointImages = buildingImages.filter(
        (img) => img.pointLabel === image.label || img.label === image.label
      );

      if (waypointImages.length > 0) {
        // 날짜순 정렬
        waypointImages.sort((a, b) => new Date(a.date) - new Date(b.date));
        // 가장 오래된 이미지 URL
        firstImageUrl = validateImageUrl(
          waypointImages[0].url || waypointImages[0].imageUrl
        );
      }
    }

    // 현재 이미지와 첫 관측 이미지가 같더라도 처리 진행
    // 이미지가 없는 경우에는 현재 이미지를 첫 관측 이미지로 사용
    if (!firstImageUrl) {
      firstImageUrl = imageUrl;
    }

    setSelectedImage({
      imageUrl: imageUrl,
      index: index,
      label: image.label,
      date: image.date,
<<<<<<< HEAD
      widthMm: image.widthMm,
=======
      width_mm: image.width_mm,
>>>>>>> 7ae69d123087776ebc6e0d5651766201e85ef1fd
      firstImageUrl: firstImageUrl,
    });
  };

  // 팝업 닫기 핸들러
  const closePopup = () => {
    setSelectedImage(null);
  };

  // 이미지 렌더링 함수
  const renderImages = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <p>균열 이미지 로딩 중...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      );
    }

    if (!buildingId) {
      return (
        <div className={styles.placeholder}>
          <p>건물을 선택하면 균열 이미지가 표시됩니다</p>
        </div>
      );
    }

    if (!images || images.length === 0) {
      return (
        <div className={styles.noDataMessage}>
          해당 구조물의 측정 데이터가 없습니다.
        </div>
      );
    }

    // 모든 이미지를 한 줄에 가로로 나열
    return images.map((image, index) => {
      const imageUrl =
        typeof image === "string"
          ? validateImageUrl(image)
          : validateImageUrl(image.url || image.imageUrl);

      // 이미지 URL이 null이면 렌더링하지 않음
      if (!imageUrl) return null;

      return (
        <div
          key={`img-${index}`}
          className={styles.imageWrapper}
          onClick={() => handleImageClick(image, index)}
        >
          <img
            src={imageUrl}
            alt={`균열 이미지 ${index + 1}`}
            className={styles.image}
          />
<<<<<<< HEAD
          {(image.label || image.widthMm) && (
=======
          {(image.label || image.width_mm) && (
>>>>>>> 7ae69d123087776ebc6e0d5651766201e85ef1fd
            <div className={styles.imageInfo}>
              {image.label && (
                <span className={styles.waypointLabel}>{image.label}</span>
              )}
<<<<<<< HEAD
              {image.widthMm && (
                <span className={styles.width}>{image.widthMm}mm</span>
=======
              {image.width_mm && (
                <span className={styles.width}>{image.width_mm}mm</span>
>>>>>>> 7ae69d123087776ebc6e0d5651766201e85ef1fd
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <div className={styles.imageGrid}>{renderImages()}</div>

      {/* 이미지 팝업 */}
      {selectedImage && (
        <ImagePopup
          imageUrl={selectedImage.imageUrl}
          description={
            selectedImage.label || `균열 이미지 ${selectedImage.index + 1}`
          }
          onClose={closePopup}
          metadata={{
<<<<<<< HEAD
            width: selectedImage.widthMm ? `${selectedImage.widthMm}mm` : null,
=======
            width: selectedImage.width_mm
              ? `${selectedImage.width_mm}mm`
              : null,
>>>>>>> 7ae69d123087776ebc6e0d5651766201e85ef1fd
            firstImageUrl: selectedImage.firstImageUrl,
          }}
        />
      )}
    </>
  );
}
