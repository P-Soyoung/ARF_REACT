import React, { useState, useEffect } from "react";
import styles from "./GraphCard.module.css";
<<<<<<< HEAD
import { API_BASE_URL } from "../config/api";
=======
>>>>>>> 7ae69d123087776ebc6e0d5651766201e85ef1fd
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * 동적 색상 생성 함수
 * 그래프의 각 라인에 사용할 고유한 색상을 생성합니다.
 * @param {number} index - 색상을 생성할 인덱스
 * @returns {string} - 색상 코드 (HEX 또는 HSL)
 */
const generateColor = (index) => {
  // 미리 정의된 색상 팔레트
  const baseColors = [
    "#8884d8", // 보라색
    "#ff7f7f", // 연한 빨강
    "#82ca9d", // 연한 초록
    "#ffc658", // 노랑
    "#1f77b4", // 파랑
    "#e377c2", // 분홍
    "#2ca02c", // 진한 초록
    "#ff9e4a", // 주황
    "#17becf", // 청록
    "#9467bd", // 진한 보라
    "#d62728", // 빨강
    "#7f7f7f", // 회색
  ];

  // 기본 팔레트에 있는 색상 반환
  if (index < baseColors.length) {
    return baseColors[index];
  }

  // 기본 팔레트를 넘어서는 경우 HSL 색상 동적 생성
  const hue = (index * 137.508) % 360; // 황금각을 사용하여 색상 분포
  return `hsl(${hue}, 70%, 60%)`;
};

// 범례 아이템 렌더링 함수 추가
const renderLegend = (props) => {
  const { payload } = props;

  return (
    <div className={styles.legendWrapper}>
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className={styles.legendItem}>
          {/* 동그란 아이콘과 비슷하게 스타일링 */}
          <div
            className={styles.legendIcon}
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className={styles.legendText}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * GraphCard 컴포넌트
 * 균열 폭 확장 속도를 시각화하는 그래프 카드 컴포넌트입니다.
 * 선택된 건물의 균열 측정 데이터를 시간에 따라 라인 그래프로 표시합니다.
 */
const GraphCard = ({ buildingId, buildingData }) => {
  // 상태 관리
  const [graphData, setGraphData] = useState([]); // 그래프에 표시할 데이터
  const [measurementData, setMeasurementData] = useState([]); // 측정 원본 데이터
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 오류 상태

  // 선택된 건물이 변경될 때마다 데이터 처리
  useEffect(() => {
    if (!buildingId) {
      setGraphData([]);
      setMeasurementData([]);
      setLoading(false);
      return;
    }

    // buildingData가 있으면 바로 처리
    if (buildingData) {
      processBuilding(buildingData);
      return;
    }

    // buildingData가 없는 경우에만 API 호출
    processData(buildingId);
  }, [buildingId, buildingData]);

  // 건물 데이터가 전달된 경우 직접 처리
  const processBuilding = (buildingData) => {
    if (!buildingData.waypoints || buildingData.waypoints.length === 0) {
      setGraphData([]);
      setMeasurementData([]);
      setLoading(false);
      return;
    }

    // 측정 데이터 추출 및 가공
    const allMeasurements = [];

    buildingData.waypoints.forEach((waypoint) => {
      if (waypoint.cracks && waypoint.cracks.length > 0) {
        waypoint.cracks.forEach((crack) => {
          allMeasurements.push({
            date: crack.date,
            pointId: waypoint.id,
            pointName: waypoint.label || `웨이포인트 ${waypoint.id}`,
<<<<<<< HEAD
            widthMm: crack.widthMm,
=======
            width_mm: crack.width_mm,
>>>>>>> 7ae69d123087776ebc6e0d5651766201e85ef1fd
          });
        });
      }
    });

    // 날짜로 정렬
    allMeasurements.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 그래프 데이터 구성
    const formattedData = formatGraphData(allMeasurements);
    setGraphData(formattedData);
    setMeasurementData(buildingData.waypoints);
    setLoading(false);
    setError(null);
  };

  /**
   * 건물 데이터 처리 함수
   * 건물의 측정 데이터를 그래프에 표시할 형식으로 가공합니다.
   * @param {string} buildingId - 건물 ID
   */
  const processData = async (buildingId) => {
    if (!buildingId) {
      setGraphData([]);
      setMeasurementData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // 실제 API 호출로 건물 데이터 가져오기
<<<<<<< HEAD
      const response = await fetch(`${API_BASE_URL}/buildings/${buildingId}`);
=======
      const apiBaseUrl = "https://afk-mock.onrender.com";
      const response = await fetch(`${apiBaseUrl}/buildings/${buildingId}`);
>>>>>>> 7ae69d123087776ebc6e0d5651766201e85ef1fd

      if (!response.ok) {
        throw new Error("건물 데이터를 불러오는 데 실패했습니다");
      }

      const buildingData = await response.json();
      processBuilding(buildingData);
    } catch (error) {
      console.error("균열 데이터 불러오기 오류:", error);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  // 측정 데이터를 그래프 데이터 형식으로 변환하는 함수
  const formatGraphData = (measurements) => {
    // 날짜별로 그룹화
    const dataByDate = {};

    measurements.forEach((item) => {
      const dateStr = item.date;
      if (!dataByDate[dateStr]) {
        dataByDate[dateStr] = {
          date: dateStr,
        };
      }

      // 각 측정 지점을 별도의 선으로 표시
<<<<<<< HEAD
      dataByDate[dateStr][`point_${item.pointId}`] = item.widthMm;
=======
      dataByDate[dateStr][`point_${item.pointId}`] = item.width_mm;
>>>>>>> 7ae69d123087776ebc6e0d5651766201e85ef1fd
      dataByDate[dateStr][`pointName_${item.pointId}`] = item.pointName;
    });

    // 객체를 배열로 변환
    return Object.values(dataByDate);
  };

  // 그래프에 표시할 측정 지점(선) 목록 생성
  const getLines = () => {
    if (!graphData || graphData.length === 0) return [];

    const firstDataPoint = graphData[0];
    const lines = [];

    // 첫 번째 데이터 포인트에서 모든 측정 지점(key가 point_로 시작하는 항목) 찾기
    Object.keys(firstDataPoint).forEach((key) => {
      if (key.startsWith("point_")) {
        const pointId = key.replace("point_", "");
        const pointName =
          firstDataPoint[`pointName_${pointId}`] || `측정 지점 ${pointId}`;

        lines.push({
          id: pointId,
          name: pointName,
          dataKey: key,
        });
      }
    });

    return lines;
  };

  // 로딩 중일 때 표시할 내용
  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <h3 className={styles.title}>균열 폭 확장 속도</h3>
          <div className={styles.graphContainer}>
            <div className={styles.noDataMessage}>데이터를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  // 오류 발생 시 표시할 내용
  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <h3 className={styles.title}>균열 폭 확장 속도</h3>
          <div className={styles.graphContainer}>
            <div className={styles.noDataMessage}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // 메인 컴포넌트 렌더링
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* 카드 헤더 영역 */}
        <div className={styles.header}>
          <h3 className={styles.title}>균열 폭 변화 추이</h3>
        </div>

        {/* 그래프 컨테이너 */}
        <div className={styles.graphContainer}>
          {/* 데이터가 없을 경우 안내 메시지 표시 */}
          {!measurementData ||
          measurementData.length === 0 ||
          graphData.length === 0 ? (
            <div className={styles.noDataMessage}>
              {buildingId
                ? "해당 구조물의 측정 데이터가 없습니다."
                : "구조물을 선택해주세요."}
            </div>
          ) : (
            // 데이터가 있을 경우 그래프 표시
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={graphData}
                margin={{ top: 20, right: 10, left: 0, bottom: 30 }}
              >
                {/* 그리드 라인 */}
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e0e0e0"
                  vertical={false}
                />

                {/* X축 (날짜) */}
                <XAxis
                  dataKey="date"
                  stroke="#333"
                  tick={{ fill: "#999" }}
                  style={{ fontSize: "0.8rem" }}
                  axisLine={false}
                  tickLine={false}
                />

                {/* Y축 (균열 폭, mm 단위) */}
                <YAxis
                  stroke="#333"
                  tick={{ fill: "#999" }}
                  domain={[0, 1.6]} /* Y축 범위 고정 */
                  style={{ fontSize: "0.8rem" }}
                  axisLine={false}
                  tickLine={false}
                  width={30} /* Y축 너비 설정 */
                />

                {/* 툴크 (마우스 오버 시 상세 정보) */}
                <Tooltip
                  cursor={{ stroke: "#ccc", strokeDasharray: "3 3" }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    color: "#333",
                    fontSize: "0.8rem",
                    padding: "0.5rem 0.8rem",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                  itemStyle={{ padding: "2px 0" }}
                  labelStyle={{ fontWeight: "bold", marginBottom: "5px" }}
                />

                {/* 범례 */}
                <Legend content={renderLegend} />

                {/* 각 웨이포인트별 측정 라인 */}
                {getLines().map((line, index) => {
                  const lineColor = generateColor(index);
                  // RGBA 색상 생성을 위한 함수
                  const getRGBA = (hex, alpha) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                  };

                  // 각 선의 색상에 맞는 그림자 효과 생성
                  const shadowFilter = `drop-shadow(0px 2.25px 2.25px ${getRGBA(
                    lineColor,
                    0.4
                  )}) 
                                     drop-shadow(0px 4.5px 6.75px ${getRGBA(
                                       lineColor,
                                       0.4
                                     )}) 
                                     drop-shadow(0px 6.75px 13.5px ${getRGBA(
                                       lineColor,
                                       0.4
                                     )})`;

                  return (
                    <Line
                      key={line.id}
                      type="monotone"
                      dataKey={line.dataKey}
                      name={line.name}
                      stroke={lineColor}
                      strokeWidth={0.75}
                      dot={{
                        r: 4,
                        fill: "#fff",
                        stroke: lineColor,
                        strokeWidth: 0.75,
                      }}
                      activeDot={{
                        r: 6,
                        fill: lineColor,
                        stroke: "#fff",
                        strokeWidth: 0.75,
                      }}
                      filter={shadowFilter}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphCard;
