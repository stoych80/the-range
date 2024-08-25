window.onload = ()=>{
	const fetch_the_products = async (start_from=0) => {
		const products_per_batch = 12;
		
		start_from = parseInt(start_from);
		if (start_from==0) {
			document.getElementById('the_range_products').innerHTML='';
		}
		const ther_loaddata_from = document.getElementById('ther_loaddata_from').value, ther_loadmore_button_dom=document.getElementById('ther_loadmore_button'), ther_sortby_selected = document.getElementById('ther_sortby_selected').value;
		ther_loadmore_button_dom.childNodes[1].style.display='inline-block'; //show the spinner
		const resp = await fetch(ther_loaddata_from==1 ? 'data/product.json' : 'Products.php', {
			method: 'POST',
			headers: {
			  'Accept': 'application/json',
			  'Content-Type': 'application/json'
			},
			body: JSON.stringify({start_from: start_from, order_by:ther_sortby_selected})
		});
		const the_json = await resp.json();
		//if we fetch from the json file order here, otherwise the order was in the backend
		if (ther_loaddata_from==1 && the_json.product_arr.length) {
			switch(ther_sortby_selected) {
				case 'ther_sorting_byprice':
					the_json.product_arr.sort(function(a, b){return a.price - b.price;});
				break;
				case 'ther_sorting_byreview':
					the_json.product_arr.sort(function(a, b){return a.reviews - b.reviews;});
				break;
				case 'ther_sorting_byname':
					the_json.product_arr.sort(function(a, b) {
						let x = a.name.toLowerCase();
						let y = b.name.toLowerCase();
						if (x < y) {return -1;}
						if (x > y) {return 1;}
						return 0;
					});
				break;
				case 'ther_sorting_bysaving':
					//add a new property to the_json - saving, which will be was_price - price. Then order by this new property.
					for (let i=0;i<the_json.product_arr.length;i++) {
						the_json.product_arr[i]['saving']=the_json.product_arr[i].was_price ? the_json.product_arr[i].was_price - the_json.product_arr[i].price : 0;
					}
					the_json.product_arr.sort(function(a, b){return a.saving - b.saving;});
				break;
			}
		}
		
		ther_loadmore_button_dom.childNodes[1].style.display='none'; //hide the spinner
		ther_loadmore_button_dom.style.opacity = the_json.next_batch_count==0 ? '25%' : '100%';
		ther_loadmore_button_dom.disabled = the_json.next_batch_count==0; //disable the Load More button if there are no more products
		if (the_json.next_batch_count > 0)
		document.getElementById('start_fromm').value=start_from+products_per_batch; //prepare the start_fromm for the next load if any
	
		build_products_html(the_json.product_arr);
	};
	
	const build_products_html = (the_json) => {
		if (!the_json.length) {
			return;
		}
		
		let the_html = '<div class="row">';
		for (let i=0;i<the_json.length;i++) {
			the_html += '<div class="col-md-3"><div class="innerrr the_rangeproduct">\n\
			<div class="the_rangeproduct_img"><img src="'+(the_json[i].img ? 'img/'+the_json[i].img+'.jpg' : 'https://commercial.bunn.com/img/image-not-available.png')+'" /></div>\n\
			<div class="the_rangeproduct_name">'+the_json[i].name+'</div>\n\
			<div class="the_rangeproduct_price">&pound;'+(the_json[i].price ? Number(the_json[i].price).toFixed(2) : 'N/A')+'</div>\n\
			<div class="the_rangeproduct_wasprice">'+(the_json[i].was_price ? 'Was <span class="the_rangeproduct_wasprice2">&pound;'+Number(the_json[i].was_price).toFixed(2)+'</span>' : '')+'</div>\n\
			<div class="the_rangeproduct_reviews">'+(the_json[i].reviews ? the_json[i].reviews+'% Review Score' : '')+'</div>\n\
			<div class="the_rangeproduct_addtobasket"><input type="button" value="Add To Basket" /></div>\n\
			</div></div>';
			if ((i+1)%4===0 && i < the_json.length-1) {
				the_html += '</div><div class="row">';
			}
		}
		the_html += '</div>';
		document.getElementById('the_range_products').innerHTML+=the_html;
	};
	
	document.getElementById('ther_loaddata_from').addEventListener("change", ()=>{
		document.getElementById('start_fromm').value=0;
		fetch_the_products();
	});
	document.getElementById('ther_loadmore_button').addEventListener("click", ()=>{
		fetch_the_products(document.getElementById('start_fromm').value);
	});
	for (const i of ['ther_sorting_byprice', 'ther_sorting_byreview', 'ther_sorting_byname', 'ther_sorting_bysaving'])
	document.getElementById(i).addEventListener("click", ()=>{
		document.getElementById('ther_sortby_selected').value=i;
		for (const k of ['ther_sorting_byprice', 'ther_sorting_byreview', 'ther_sorting_byname', 'ther_sorting_bysaving'])
		document.getElementById(k).style['box-shadow']=k==i ? '0 0 20px #777' : 'none';
		fetch_the_products();
	});
	fetch_the_products();
};