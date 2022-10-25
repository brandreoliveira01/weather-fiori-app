sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'weatherFioriApp/services/OpenWeather',
    'weatherFioriApp/util/Utils',
  ],
  function (Controller, JSONModel, OpenWeather, Utils) {
    'use strict';

    return Controller.extend('weatherFioriApp.controller.Main', {
      onInit: function () {
        this._initStateComboBox();
        this._initGeoLocation();
      },

      _initStateComboBox: function () {
        const oStatesModel = this.getView().getModel('statesModel');
        const oStateComboBox = this.getView().byId('stateComboBox');

        oStateComboBox.setModel(oStatesModel);

        oStateComboBox.setFilterFunction(function (sTerm, oItem) {
          return (
            oItem.getText().match(new RegExp(sTerm, 'i')) ||
            oItem.getKey().match(new RegExp(sTerm, 'i'))
          );
        });
      },

      _initGeoLocation: function () {
        const that = this;

        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(async function (position) {
            const oCityAndState = await OpenWeather.getReverseGeo(
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
            const oCityComboBox = that.getView().byId('cityComboBox');
            const oStateComboBox = that.getView().byId('stateComboBox');

            that._initCityComboBox(stateId);

            oStateComboBox.setSelectedKey(stateId);
            oCityComboBox.setSelectedKey(cityId);
            oCityComboBox.fireChange();
          });
        }
      },

      onStateChange: function (oEvent) {
        const sSelectedState = parseInt(oEvent.getSource().getSelectedKey());

        this._initCityComboBox(sSelectedState);
      },

      _initCityComboBox: function (sStateId) {
        const oCitiesModel = this.getView().getModel('citiesModel');
        const oCityComboBox = this.getView().byId('cityComboBox');
        const aFilteredCities = oCitiesModel
          .getProperty('/cities')
          .filter((city) => city.state_id === sStateId);
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
        const oGeoPos = await OpenWeather.getDirectGeo(sState, sCity);
        const oWeatherData = await OpenWeather.getWeatherData(oGeoPos.lat, oGeoPos.lon);
        const oLocalModel = this.getView().getModel('localModel');

        oWeatherData.weather[0].description = Utils.capitalizeSentence(
          oWeatherData.weather[0].description,
        );

        // Convert wind speed to km/h
        oWeatherData.wind.speed = Math.round(oWeatherData.wind.speed * 3.6);

        oLocalModel.setProperty('/CurrentWeather', oWeatherData);
      },
    });
  },
);
