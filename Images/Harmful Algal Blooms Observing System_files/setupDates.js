      function calculateFormDates()  {
        var dst = false;
        var today = new Date();
        Date.prototype.stdTimezoneOffset = function() {
          var jan = new Date(this.getFullYear(), 0, 1);
          var jul = new Date(this.getFullYear(), 6, 1);
          return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
        }
        Date.prototype.dst = function() {
          return this.getTimezoneOffset() < this.stdTimezoneOffset();
        }
        if (today.dst())  dst = true;
        var gmtMS = today.getTime() + (today.getTimezoneOffset() * 60000);

        // NWS Forecasts
        var values = [];
        for (i=1;i<4;i++)  {
          newDate = new Date(gmtMS + i * 24 * 60 * 60 * 1000);
          mth = newDate.getMonth() + 1;
          day = newDate.getDate();
          year = newDate.getFullYear();
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@0000Z (" + i*24 + " Hr Forecast)";
          values.push({name:dDate});
        } 
        var dataItems = {
          identifier: 'name',
          label: 'name',
          items: values
        };
        var store = new dojo.data.ItemFileReadStore({data:dataItems});
        dijit.byId("atmp_forecast").set("store", store);
        dijit.byId("pop12_forecast").set("store", store);
        dijit.byId("qpf_forecast").set("store", store);

        // AMSEAS forecasts and hindcasts (replaces NCOM and IASNFS)
        var values = [];
        for (i=2;i>-1;i--)  {
          newDate = new Date(gmtMS + i * 24 * 60 * 60 * 1000);
          mth = newDate.getMonth() + 1;
          day = newDate.getDate();
          year = newDate.getFullYear();
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          if (i == 0)  {
            dDate += "@0000Z (Today)";
          }
          else  {
            dDate += "@0000Z (" + i*24 + " Hr Forecast)";
          }
          values.push({name:dDate});
        } 
        for (i=1;i<30;i++)  {
          newDate = new Date(gmtMS - i * 24 * 60 * 60 * 1000);
          mth = newDate.getMonth() + 1;
          day = newDate.getDate();
          year = newDate.getFullYear();
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          if (i == 1)  {
            dDate += " (1 Day Ago)";
          }
          else {
            dDate += " (" +i+ " Days Ago)";
          }
          values.push({name:dDate});
        }
        var dataItems = {
          identifier: 'name',
          label: 'name',
          items: values
        };
        var store = new dojo.data.ItemFileReadStore({data:dataItems});
        dijit.byId("ssc_timeframe").set("store", store);
        dijit.byId("ssh_timeframe").set("store", store);
        dijit.byId("sss_timeframe").set("store", store);
        dijit.byId("sst_timeframe").set("store", store);

        // NAM12 Forecasts
        var values = [];
        //if (!dst) {
        if (today.getUTCHours() <= 18) {
          newDate = new Date(gmtMS + 0 * 24 * 60 * 60 * 1000);
          mth = newDate.getMonth() + 1;
          day = newDate.getDate();
          year = newDate.getFullYear();
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@0000Z (00 Hr Forecast)";
          values.push({name:dDate}); 
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@1200Z (12 Hr Forecast)";
          values.push({name:dDate}); 
          newDate = new Date(gmtMS + 1 * 24 * 60 * 60 * 1000);
          mth = newDate.getMonth() + 1;
          day = newDate.getDate();
          year = newDate.getFullYear();
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@0000Z (24 Hr Forecast)";
          values.push({name:dDate});
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@1200Z (36 Hr Forecast)";
          values.push({name:dDate}); 
          newDate = new Date(gmtMS + 2 * 24 * 60 * 60 * 1000);
          mth = newDate.getMonth() + 1;
          day = newDate.getDate();
          year = newDate.getFullYear();
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@0000Z (48 Hr Forecast)";
          values.push({name:dDate}); 
          newDate = new Date(gmtMS + 3 * 24 * 60 * 60 * 1000);
          mth = newDate.getMonth() + 1;
          day = newDate.getDate();
          year = newDate.getFullYear();
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@0000Z (72 Hr Forecast)";
          values.push({name:dDate}); 
        }
        else  {
          newDate = new Date(gmtMS + 0 * 24 * 60 * 60 * 1000);
          mth = newDate.getMonth() + 1;
          day = newDate.getDate();
          year = newDate.getFullYear();
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@1200Z (00 Hr Forecast)";
          values.push({name:dDate});
          newDate = new Date(gmtMS + 1 * 24 * 60 * 60 * 1000);
          mth = newDate.getMonth() + 1;
          day = newDate.getDate();
          year = newDate.getFullYear(); 
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@0000Z (12 Hr Forecast)";
          values.push({name:dDate});
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@1200Z (24 Hr Forecast)";
          values.push({name:dDate});
          newDate = new Date(gmtMS + 2 * 24 * 60 * 60 * 1000);
          mth = newDate.getMonth() + 1;
          day = newDate.getDate();
          year = newDate.getFullYear();
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@0000Z (36 Hr Forecast)";
          values.push({name:dDate}); 
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@1200Z (48 Hr Forecast)";
          values.push({name:dDate}); 
          newDate = new Date(gmtMS + 3 * 24 * 60 * 60 * 1000);
          mth = newDate.getMonth() + 1;
          day = newDate.getDate();
          year = newDate.getFullYear();
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          dDate += "@1200Z (72 Hr Forecast)";
          values.push({name:dDate}); 
        } 
        var dataItems = {
          identifier: 'name',
          label: 'name',
          items: values
        };
        var store = new dojo.data.ItemFileReadStore({data:dataItems});
        dijit.byId("nam12Winds_forecast").set("store", store);


        // remote sensing imagery 
        var values = []; 
        for (i=1;i<30;i++)  {
          newDate = new Date(gmtMS - i * 24 * 60 * 60 * 1000);
          mth = newDate.getMonth() + 1;
          day = newDate.getDate();
          year = newDate.getFullYear();
          var dDate = year + "-" + ((mth < 10) ? "0" : "") + mth + "-" + ((day < 10) ? "0" : "") + day;
          if (i == 1)  {
            dDate += "  (1 Day Ago)";
          }
          else {
            dDate += "  (" +i+ " Days Ago)";
          }
          values.push({name:dDate});
        }
        var dataItems = {
          identifier: 'name',
          label: 'name',
          items: values
        };
        var store = new dojo.data.ItemFileReadStore({data:dataItems});
        dijit.byId("chl_thredds_timeframe").set("store", store);
        dijit.byId("chl_anomaly_timeframe").set("store", store);
        dijit.byId("ergb_usf_timeframe").set("store", store);
        dijit.byId("nflh_usf_timeframe").set("store", store);
        dijit.byId("sst_usf_timeframe").set("store", store);
      }