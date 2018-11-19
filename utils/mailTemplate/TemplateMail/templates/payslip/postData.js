function OpenWindowWithPost(url, windowoption, name, params)
{
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", url);
        form.setAttribute("target", name);

        for (var i in params) {
            if (params.hasOwnProperty(i)) {
                var input = document.createElement('input');
                input.type = 'hidden';
                input.name = i;
                input.value = params[i];
                form.appendChild(input);
            }
        }
        
        document.body.appendChild(form);
        
        //note I am using a post.htm page since I did not want to make double request to the page 
       //it might have some Page_Load call which might screw things up.
        window.open(url, name, windowoption);
        
        form.submit();
        
        document.body.removeChild(form);
}

function openPost(link, body)
{		    		
  OpenWindowWithPost(link, 
  "width=730,height=345,left=100,top=100,resizable=yes,scrollbars=yes", 
  "NewFile", body);		
}