$(document).ready(function(){
	
		var host = $('#host').val();

		$('#submitPic').on('click',function(){
			uploadNow()
		})

		
		var socket = io.connect(host);

		socket.on('status', function(data){
			console.log(data.msg + data.delay);
		})
		socket.on('doUpdate', function(){
			renderList();
		})
		
		renderList();

		function renderList(){
			$('.photogrid').html('');
			$.ajax({
				url: host +'/getimages',
				success:function(data){
				var photos = JSON.parse(data);
				
				for(var i = 0; i< photos.length; i++){

						var str	= '';
		               		str += '<div class="col-md-3 pgrid">';
		                   	str +=	'<div class="thumbnail">';
		                    str +=  '<a href="/'+photos[i]._id+' ">';
		                    str +=  '<img class="img-responsive" src="http://d13q6gbqrcsecv.cloudfront.net/'+photos[i].filename+'" alt="">';
		                    str +=   '</a>';
		                    str +=   '<div class="caption">';
		                    str +=   '<button type="button" value="'+photos[i]._id+'" id="vote" class="btn btn-default btn-sm"> Upvote  ';
		                    str +=   '<span class="glyphicon glyphicon-heart" style="color:red"><span class="voteCount">  '+photos[i].votes+'</span></span>';
		                    str +=   '</button> </div><div></div>';
		                   
		                    $('.photogrid').append(str);
               		}
          		}
			})
		}
		
		function uploadNow(){
			$('.progress').fadeIn('fast');
			
			var uploadUrl = host + '/upload';
			var uploadFile = $('#handleUpload');

			if(uploadFile.val() != ''){
				var form = new FormData()
				form.append("upload", uploadFile[0].files[0])
				
				sendForm(form,uploadUrl)
				

			}
		}


		function sendForm(formData,url) {
			  var xhr = new XMLHttpRequest();
			  xhr.open('POST', url, true);
			  xhr.addEventListener("progress", function(evt){
								    var $upBar = $("#uploadBar")
								      if (evt.lengthComputable) {
								      	
								        var percentComplete = Math.round(evt.loaded * 100 / evt.total);
								        //Do something with upload progress
								        $upBar.attr('aria-valuenow', percentComplete + '%').css('width', percentComplete + '%')
								      
								        }
				}, false)	
			  xhr.send(formData);
			  xhr.onload = $('.progress').fadeOut('slow');
		}

		$(document).on('click', '#vote',function(e){
			var that = $(this);
		
			
			$.ajax({
				url: host + '/voteup/' + e.currentTarget.value,
				success: function(data){
					console.log(data);
					that.find( "span" ).css( "color", "red" ).html(" "+ data.votes);
				}


			})

		}) 


	
})
