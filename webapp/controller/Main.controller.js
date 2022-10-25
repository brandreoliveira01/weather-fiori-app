sap.ui.define(
  ['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel'],
  function (Controller, JSONModel) {
    'use strict';

    return Controller.extend('weatherFioriApp.controller.Main', {
      onInit: function () {
        const that = this;
        const oStatesModel = this.getView().getModel('statesModel');
        const oStateComboBox = this.getView().byId('stateComboBox');

        oStateComboBox.setModel(oStatesModel);

        oStateComboBox.setFilterFunction(function (sTerm, oItem) {
          return (
            oItem.getText().match(new RegExp(sTerm, 'i')) ||
            oItem.getKey().match(new RegExp(sTerm, 'i'))
          );
        });

        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(async function (position) {
            const oCityAndState = await that._getCityAndState(
              position.coords.latitude,
              position.coords.longitude,
            );
            const oStatesModel = that.getView().getModel('statesModel');
            const oCitiesModel = that.getView().getModel('citiesModel');
            const stateId = parseInt(
              oStatesModel
                .getProperty('/states')
                .find((state) => state.name === oCityAndState.state).id,
            );
            const cityId = oCitiesModel
              .getProperty('/cities')
              .find((city) => city.state_id === stateId && city.name === oCityAndState.city).id;
            const aFilteredCities = oCitiesModel
              .getProperty('/cities')
              .filter((city) => city.state_id === stateId);
            const oModel = new JSONModel({ cities: aFilteredCities });
            const oCityComboBox = that.getView().byId('cityComboBox');

            oCityComboBox.setModel(oModel);

            oCityComboBox.setFilterFunction(function (sTerm, oItem) {
              return (
                oItem.getText().match(new RegExp(sTerm, 'i')) ||
                oItem.getKey().match(new RegExp(sTerm, 'i'))
              );
            });

            oStateComboBox.setSelectedKey(stateId);
            oCityComboBox.setSelectedKey(cityId);
            oCityComboBox.fireChange();
          });
        }
      },

      onStateChange: function (oEvent) {
        const oCitiesModel = this.getView().getModel('citiesModel');
        const oCityComboBox = this.getView().byId('cityComboBox');
        const sSelectedState = parseInt(oEvent.getSource().getSelectedKey());
        const aFilteredCities = oCitiesModel
          .getProperty('/cities')
          .filter((city) => city.state_id === sSelectedState);
        const oModel = new JSONModel({ cities: aFilteredCities });

        oCityComboBox.setModel(oModel);

        oCityComboBox.setFilterFunction(function (sTerm, oItem) {
          return (
            oItem.getText().match(new RegExp(sTerm, 'i')) ||
            oItem.getKey().match(new RegExp(sTerm, 'i'))
          );
        });
      },

      onCityChange: async function (oEvent) {
        const sState = this.getView().byId('stateComboBox').getSelectedItem().getText();
        const sCity = oEvent.getSource().getSelectedItem().getText();
        const oGeoPos = await this._getGeoPosition(sState, sCity);
        const oWeatherData = await this._getWeatherData(oGeoPos.lat, oGeoPos.lon);
        const oLocalModel = this.getView().getModel('localModel');

        oWeatherData.weather[0].description = this._capitalizeSentence(
          oWeatherData.weather[0].description,
        );

        // Convert wind speed to km/h
        oWeatherData.wind.speed = Math.round(oWeatherData.wind.speed * 3.6);

        oLocalModel.setProperty('/CurrentWeather', oWeatherData);
      },

      _getGeoPosition: async function (sState, sCity) {
        const oResponse = await fetch(
          `http://api.openweathermap.org/geo/1.0/direct?q=${sCity},${sState},BRA&appid=02b1ff60fa346b4fcc2b6fb4de591164`,
        )
          .then((response) => response.text())
          .catch((error) => {});
        const oParsedResponse = JSON.parse(oResponse);

        return {
          lat: oParsedResponse[0].lat,
          lon: oParsedResponse[0].lon,
        };
      },

      _getCityAndState: async function (lat, lon) {
        const oResponse = await fetch(
          `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=02b1ff60fa346b4fcc2b6fb4de591164`,
        )
          .then((response) => response.text())
          .catch((error) => {});
        const oParsedResponse = JSON.parse(oResponse);

        return {
          city: oParsedResponse[0].name,
          state: oParsedResponse[0].state,
        };
      },

      _getWeatherData: async function (lat, lon) {
        const oResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=02b1ff60fa346b4fcc2b6fb4de591164`,
        )
          .then((response) => response.text())
          .catch((error) => {});

        return JSON.parse(oResponse);
      },

      _capitalizeSentence: function (sSentence) {
        const words = sSentence.split(' ');

        return words
          .map((word) => {
            return word[0].toUpperCase() + word.substring(1);
          })
          .join(' ');
      },
    });
  },
);
