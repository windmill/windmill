/*
Copyright 2006, Open Source Applications Foundation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

//Functions for writing status to the UI
/***************************************/
windmill.service = new function () {
    //Set the URL we are testing in the python service
    this.setTestURL = function(){
      var json_object = new windmill.xhr.json_call('1.1', 'set_test_url');
      var params_obj = {};
      params_obj.url = windmill.testingApp.location.protocol+'//'+ windmill.testingApp.location.hostname;
      json_object.params = params_obj;
      var json_string = fleegix.json.serialize(json_object)

      var resp = function(str){
        return true;
      }
      
      result = fleegix.xhr.doPost('/windmill-jsonrpc/', json_string);
      resp(result);
    };
};