$(document).ready(function(){

	$(".delete-op").click(function() {

		var idOp = $(this).parent(".operation").attr("id");
		$("#spinner").show();

		$.ajax({
			type: 'post',
			url: '/delete',
			data: {id:idOp},
			success: function(){
				document.location.reload();
			},
			complete: function(){
				// $("#spinner").hide();
			}
		});
	});

});
