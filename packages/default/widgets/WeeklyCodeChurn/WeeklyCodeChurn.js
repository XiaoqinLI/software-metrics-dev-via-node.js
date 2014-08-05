widget = {
    onData: function (el, data) {

        $('.content', el).empty();

        if (data.title) {
            $('h2', el).text(data.title);
        }
        $('.content', el).append(
            "<div id='selectorDiv'>" + "Select a Repo: " +
            "<select id='RepoID'>" +
            "</select>" +
            "</div>"
               );
        for (j = 0; j < data.statsList.length; j++) {
            $('select', el).append(
                "<option value='" + data.statsList[j].repoID + "'>" + data.statsList[j].repoID +
                "</option>"
                )
        }  

        for (j = 0; j < data.statsList.length; j++) {
            var repoID = data.statsList[j].repoID
            var cur_add = data.statsList[j].CurrLinesAdded;
            var cur_del = data.statsList[j].CurrLinesDeleted;
            var add_diff = data.statsList[j].AddedDiff;
            var del_diff = data.statsList[j].DeletededDiff;
            var diffText = " compared to last iter";
            
            $('.content', el).append(

                 "<div id='" + repoID + "'" +  " class='targetDiv'" +">" +
                 "</div>"
                );

            $('#' + repoID, el).append(

                       "<div class='item-container-add'>" +
                           "<div class='title'>" + "Lines Added" + "</div>" +
                           "<div class='current'>" + cur_add.toString() + "</div>" +
                       "</div>"

               );

            $('#' + repoID, el).append(

                "<div class='item-container-delete'>" +
                    "<div class='title'>" + "Lines Deleted" + "</div>" +
                    "<div class='current'>" + cur_del.toString() + "</div>" +
                "</div>"
                );

            if (add_diff >= 0) {
                $('#' + repoID, el).append("<div class='graph-add' style='color:red'>" + add_diff.toString() + " " + "<img src='images/red-up.png'></div>");
            } else {
                $('#' + repoID, el).append("<div class='graph-add' style='color:green'>" + Math.abs(add_diff).toString() + " " + "<img src='images/green-down.png'></div>");
            }
            if (del_diff >= 0) {
                $('#' + repoID, el).append("<div class='graph-del' style='color:red'>" + del_diff.toString() + " " + "<img src='images/red-up.png'></div>");
            } else {
                $('#' + repoID, el).append("<div class='graph-del' style='color:green'>" + Math.abs(del_diff).toString() + " " + "<img src='images/green-down.png'></div>");
            }
            $('#' + repoID, el).append("<div class='text'>" + diffText + "</div>");
        }// end of forloop

        var jsCode = "$(document).ready(function() {\
                        $('#RepoID').change(function(){\
                            var location = $(this).val(),\
                            div = $('#' + location);\
                            $('.targetDiv').hide();\
                            div.show();\
                         });\
                      });";
        var script = document.createElement('script');
        script.type = 'text/javascript';      
        script.innerText = jsCode;
        $('.content').append(script);

    }//end of onData
}


