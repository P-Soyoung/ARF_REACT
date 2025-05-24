import React, { useRef, useState, useEffect } from "react";
import styles from "./ImageCard.module.css";
import { API_BASE_URL } from "../config/api";
import ImagePopup from "./ImagePopup";
import ImageGallery from "./ImageGallery";
import ImageAligner from "./ImageAligner"; // ⬅️ 추가

export default function ImageCard({ buildingId, buildingData }) {
  const scrollContainerRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imagesPerRow, setImagesPerRow] = useState(2);
  const [buildingImages, setBuildingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [buildingName, setBuildingName] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredImages, setFilteredImages] = useState([]);

  const alignerRef = useRef(); // ⬅️ ImageAligner 참조용
  const [resultImage, setResultImage] = useState(null); // ⬅️ 결과 이미지 저장

  const validateImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (!url.startsWith("/")) return `/${url}`;
    return url;
  };

  useEffect(() => {
    if (!buildingId) {
      setLoading(false);
      return;
    }
    if (buildingData) {
      processBuilding(buildingData);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/buildings/${buildingId}`)
      .then((res) => {
        if (!res.ok) throw new Error("건물 데이터를 불러오는 데 실패했습니다");
        return res.json();
      })
      .then((building) => processBuilding(building))
      .catch((err) => {
        console.error("이미지 데이터 로드 실패:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [buildingId, buildingData]);

  const processBuilding = (building) => {
    setBuildingName(building.name || `건물 ${buildingId}`);
    const images = [];
    const dateSet = new Set();

    if (building.waypoints?.length > 0) {
      building.waypoints.forEach((waypoint) => {
        waypoint.cracks?.forEach((crack) => {
          if (crack.timestamp) dateSet.add(crack.timestamp);
          if (crack.imageUrl) {
            images.push({
              url: crack.imageUrl,
              date: crack.timestamp,
              widthMm: crack.widthMm,
              pointLabel: waypoint.label || `웨이포인트 ${waypoint.id}`,
            });
          }
        });
      });
    }

    setBuildingImages(images);
    const dateArray = Array.from(dateSet).sort(
      (a, b) => new Date(b) - new Date(a)
    );
    setAvailableDates(dateArray);

    if (dateArray.length > 0) {
      setSelectedDate(dateArray[0]);
      const filtered = images.filter((img) => img.date === dateArray[0]);
      setFilteredImages(filtered);
    }

    setLoading(false);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    const filtered = buildingImages.filter((img) => img.date === newDate);
    setFilteredImages(filtered);
    setCurrentImageIndex(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
      setScrollLeft(0);
    }
  };

  const displayImages =
    filteredImages?.map((wp) => ({
      url: validateImageUrl(wp.url || wp.imageUrl),
      label: wp.label || wp.pointLabel,
      date: wp.date,
      widthMm: wp.widthMm,
    })) || [];

  const getCrackSeverityColor = (width) => {
    if (width >= 2.0) return "#cc3300";
    if (width >= 1.0) return "#ff9933";
    if (width >= 0.5) return "#ffdb4d";
    return "#66cc66";
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>관측 사진</h2>
          {availableDates.length > 0 && (
            <div className={styles.dateSelector}>
              <select
                value={selectedDate || ""}
                onChange={handleDateChange}
                className={styles.dateSelect}
              >
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString("ko-KR")}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div ref={scrollContainerRef} className={styles.imageContainer}>
        <ImageGallery
          images={displayImages}
          loading={loading}
          error={error}
          buildingId={buildingId}
          buildingImages={buildingImages}
          validateImageUrl={validateImageUrl}
        />
      </div>

      {/* 🔍 분석 버튼 및 결과 표시 */}
      {displayImages.length >= 2 && (
        <div className={styles.analysisSection}>
          <button
            className={styles.analyzeButton}
            onClick={() => alignerRef.current?.setPriorityMode("foreground")}
          >
            균열 변화 분석하기
          </button>

          <ImageAligner
            ref={alignerRef}
            firstImageUrl={displayImages[0].url}
            currentImageUrl={displayImages[1].url}
            onProcessed={setResultImage}
          />

          {resultImage && (
            <div className={styles.resultImageBox}>
              <h3>분석 결과 이미지</h3>
              <img
                src={resultImage}
                alt="분석된 이미지"
                className={styles.resultImage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
