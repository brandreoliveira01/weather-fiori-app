sap.ui.define([], function () {
  'use strict';

  return {
    _baseUri: 'http://api.openweathermap.org',

    _endPoints: {
      directGeo: '/geo/1.0/direct',
      reverseGeo: '/geo/1.0/reverse',
      weatherData: '/data/2.5/weather',
    },

    _apiKey: '02b1ff60fa346b4fcc2b6fb4de591164',

    getDirectGeo: async function (sState, sCity) {
      const sParams = `q=${sCity},${sState},BR&appid=${this._apiKey}`;
      const oResponse = await this._getData(this._endPoints.directGeo, sParams);

      return {
        lat: oResponse[0].lat,
        lon: oResponse[0].lon,
      };
    },

    getReverseGeo: async function (lat, lon) {
      const sParams = `lat=${lat}&lon=${lon}&appid=${this._apiKey}`;
      const oResponse = await this._getData(this._endPoints.reverseGeo, sParams);

      return {
        city: oResponse[0].name,
        state: oResponse[0].state,
      };
    },

    getWeatherData: async function (lat, lon) {
      const sParams = `lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${this._apiKey}`;
      const oResponse = await this._getData(this._endPoints.weatherData, sParams);

      return oResponse;
    },

    _getData: async function (sEndPoint, sParams) {
      const oResponse = await fetch(`${this._baseUri}${sEndPoint}?${sParams}`)
        .then((response) => response.text())
        .catch((error) => {});

      return JSON.parse(oResponse);
    },
  };
});
