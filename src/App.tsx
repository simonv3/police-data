import React, { useEffect } from "react";
import Chart from "react-apexcharts";
import Papa from "papaparse";
import { uniq } from "lodash";
import Select, { ValueType, OptionTypeBase } from "react-select";
import styled from "styled-components";

type SeriesObject = {
  city: string;
  data: number[];
  county: string;
};

type OptionType = {
  value: string;
  label: string;
};

function App() {
  const [allData, setAllData] = React.useState<SeriesObject[]>([]);
  const [selectedData, setSelectedData] = React.useState<SeriesObject[]>([]);
  const [counties, setCounties] = React.useState<string[]>([]);
  const [cities, setCities] = React.useState<OptionType[]>([]);
  const [selectedCities, setSelectedCities] = React.useState<
    ValueType<OptionTypeBase>
  >([]);
  const [county, setCounty] = React.useState<string>("Marin");
  const [categories, setCategories] = React.useState<string[]>([]);

  useEffect(() => {
    setSelectedCities(
      allData
        .filter((datum) => datum.county === county)
        .map((datum) => ({
          label: datum.city,
          value: datum.city,
        }))
    );
  }, [allData, county]);

  useEffect(() => {
    setSelectedData(
      allData.filter((datum) =>
        selectedCities?.find(
          (city: { label: any }) => city.label === datum.city
        )
      )
    );
  }, [selectedCities, allData]);

  const options = {
    colors: [
      "#528b8b",
      "#eea2ad",
      "#eed8ae",
      "#8b3626",
      "#d8bfd8",
      "#6ca6cd",
      "#cd6839",
      "#bbffff",
      "#daa520",
      "#b4eeb4",
      "#9bcd9b",
    ],
    chart: {
      type: "line",
    },
    series: selectedData,
    xaxis: {
      categories,
    },
    tooltip: {
      y: {
        title: {
          formatter: (seriesName: string, options: any) => {
            const seriesIndex = +seriesName.split("-")[1];
            return selectedData[seriesIndex - 1]?.city;
          },
        },
      },
    },
    legend: { show: false },
  };

  React.useEffect(() => {
    async function getData() {
      const response = await fetch("/data/per-cap.csv");
      const reader = response.body?.getReader();
      const result = await reader?.read(); // raw array
      const decoder = new TextDecoder("utf-8");
      const csv = decoder.decode(result?.value); // the csv text
      const results = Papa.parse(csv, { header: true }); // object with { data, errors, meta }
      const rows = results.data as any[]; // array of objects
      const years: string[] = [];
      const newCounties: string[] = [];
      const newCities: string[] = [];
      setAllData(
        rows.map((row, index) => {
          newCounties.push(row.County?.trim());
          newCities.push(row.City?.trim());
          const data = Object.keys(row)
            .filter((key: string) => {
              const isYear = !(key === "City" || key === "County");
              if (isYear && index === 0) {
                years.push(key.trim());
              }
              return isYear;
            })
            .map((key) => {
              return +row[key];
            });
          return {
            city: row.City.trim(),
            county: row.County?.trim(),
            data,
          };
        })
      );
      setCounties(uniq(newCounties));
      setCities(uniq(newCities).map((city) => ({ value: city, label: city })));
      setCategories(years);
    }
    getData();
  }, []); // [] means just do this once, after initial render

  const onSelectCities = (val: ValueType<OptionTypeBase>) => {
    setSelectedCities(val);
  };

  return (
    <AppWrapper>
      <QueryWrapper>
        <FieldSet>
          <label>County:</label>
          <select
            value={county}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCounty(e.target.value)
            }
          >
            {counties.map((countyChoice) => (
              <option value={countyChoice}>{countyChoice}</option>
            ))}
          </select>
        </FieldSet>
        <Select
          value={selectedCities}
          isMulti
          styles={{
            container: (provided) => ({
              ...provided,
              width: "30rem",
            }),
          }}
          options={cities}
          onChange={onSelectCities}
          placeholder="choose cities"
        />
      </QueryWrapper>
      <Chart
        options={options}
        width="1000"
        type="line"
        series={options.series}
      />
    </AppWrapper>
  );
}

export default App;

const FieldSet = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  label {
    margin-bottom: 0.4rem;
  }
`;

const QueryWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;

  > * {
    margin-right: 2rem;
  }
`;

const AppWrapper = styled.div`
  text-align: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
`;
