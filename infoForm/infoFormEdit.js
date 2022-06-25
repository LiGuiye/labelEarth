

// const serUrl = 'http://10.0.0.141/data/imageObjects';
// const serUrl = "http://127.0.0.1:8000/imageObjects";
const serUrl = parent.window.location.origin + '/imageObjects';   //  '/data/imageObjects'

// console.log('I am trying to get user name!');

// need user to login first, so we can get the username
let username = 'username'
const queryString = parent.window.location.search;
const urlParams = new URLSearchParams(queryString);
input_username = urlParams.get('username');
if (input_username != null || input_username != 'undefined') {
    // console.log('username is:',input_username);
    username = input_username;
    document.getElementById('username').value = username;
}
let b_win_initiated = false;
// const
// const urlParams = new URLSearchParams(queryString);
// const username = urlParams.get('username')
// console.log(username);

function getNowstr(){
    let timeElapsed = Date.now();
    let now = new Date(timeElapsed);
    return now;
}

function meters_to_degrees_onEarth(distance){
    return (distance/6371000.0)*180.0/Math.PI;
}

async function get_available_image(username){
    // wait and get image info: {image name, center lat, lon}
    let item_url = serUrl + '/' + username + '/' + 'getitem';
    let response = await fetch(item_url);
    if (response.ok){
        let data = await response.json();
        return data;
    }
}

async function getOne_imageItem(){
    let img_info = await get_available_image(username);
    // console.log(img_info)
    return img_info
}

function get_GoogleMap_url(lat, lon){
    // let lat = 68.88106998594964;
    // let lon = -150.96427868325944;
    let goo_urlLeft = "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1950.428084417938!2d";
    let goo_urlRight = "!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sus!4v1646793974452!5m2!1sen!2sus";
    let googleMap_url;
    googleMap_url = goo_urlLeft + String(lon) + "!3d" + String(lat) + goo_urlRight;
    return googleMap_url;
}

function reload_GoogleMap_Frame(center_lat,center_lon){
    parent.document.getElementById('div1GoogleMap').src = get_GoogleMap_url(center_lat,center_lon);
    // console.log('reload_GoogleMap_Frame');
}

function get_esriWayBackMap_url(lat, lon){
    let ext_half_degree = meters_to_degrees_onEarth(500);
    let min_lon = lon - ext_half_degree;
    let max_lon = lon + ext_half_degree;
    let min_lat = lat - ext_half_degree;
    let max_lat = lat + ext_half_degree;

    let esriWayBack_urlLeft = "https://livingatlas.arcgis.com/wayback/#active=26120&ext=";
    let map_url;
    map_url = esriWayBack_urlLeft + `${min_lon},${min_lat},${max_lon},${max_lat}`;
    console.log('esriWayBack url:',map_url)
    return map_url;
}
function reload_esriWayBackMap_Frame(center_lat,center_lon){
    //TODO: need to solve a problem, when move the next images, the esriWayBackMap don't update
    parent.document.getElementById('div2WayBackMap').remove()

    let new_iframe = parent.document.createElement("iframe");
    new_iframe.id = 'div2WayBackMap';
    new_iframe.src = get_esriWayBackMap_url(center_lat,center_lon);
    new_iframe.width = "100%";
    new_iframe.height = "100%";
    new_iframe.style.border = "0";
    parent.document.getElementById('div2').appendChild(new_iframe);

    // parent.document.getElementById('div2WayBackMap').src = get_esriWayBackMap_url(center_lat,center_lon);
    // console.log('reload_esriWayBackMap_Frame');
}

function update_imageMap(img_info){
    // send an event in "index.js" to reload the image map
    let send_data = {'image_name':img_info.image_name,
                    'center_lat':img_info.image_center_lat,
                    'center_lon':img_info.image_center_lon,
                    'user_name':username,
                    'serUrl':serUrl}
    if (img_info.edit_polygons !== undefined && img_info.edit_polygons !== null) {
        send_data['edit_polygons'] = img_info.edit_polygons;
    }
    const event = new CustomEvent('newItem',{detail:send_data});
    // Dispatch the event to parent document.
    if (b_win_initiated === false){
        setTimeout(()=>{
            parent.document.dispatchEvent(event);
        },500);
        b_win_initiated = true;
    }else{
        parent.document.dispatchEvent(event);
    }

}

function update_three_panels(img_info){
    try{
        reload_GoogleMap_Frame(img_info.image_center_lat,img_info.image_center_lon);
    }catch (e) {
        console.log(e)
    }
    try{
        reload_esriWayBackMap_Frame(img_info.image_center_lat,img_info.image_center_lon);
    }catch (e) {
        console.log(e)
    }
    try{
        update_imageMap(img_info);
    }catch (e){
        console.log(e)
    }
}

// load the data and shows the first images after login
// each time refresh this website page, will re-run this.
getOne_imageItem().then(img_info => {
        console.log(getNowstr(),img_info);
        let image_name = document.getElementById('image_name');
        // image_name.value  = `Name: ${img_info.image_name}, Center Lat: ${img_info.image_center_lat}, Center Lon: ${img_info.image_center_lon}`;
        image_name.value  = img_info.image_name;
        if (img_info.image_name === 'NotAvailable'){
            console.log('No available image for this user');
            alert('No available image for this user');  // not working here
            return;
        }
        update_three_panels(img_info);
    }
).catch(error =>{ console.log(error)})

// Listen for the event.
// document.addEventListener('newItem', function (e)
// { console.log(getNowstr(),'addEventListener: netItem')}, false);

async function post_user_input(url){
    let img_name = document.getElementById('image_name').value;
    if (img_name === "undefined" || img_name==='NotAvailable'){
        alert('No image there!')
        return;
    }
    let formdata = new FormData();
    formdata.append("image_name", document.getElementById('image_name').value);
    formdata.append("possibility", document.getElementById('objectPossibility').value);
    formdata.append("user_note", document.getElementById('note').value);

    let requestOptions = {
        method: 'POST',
        body: formdata,
        redirect: 'follow'
    };

    // let response = await fetch(url, requestOptions);
    // if (response.ok){
    //     let meg = await response.text();
    //     console.log(meg);
    // }
    // else {
    //     console.log('SubmitAndNext in infoFormEdit failed');
    // }
     fetch(url, requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('SubmitAndNext in infoFormEdit failed', error));
     return;
}

function post_save_edit_polygons(post_url){
    // send an event in "index.js" to save the edited polygons
    let send_data = {'post_url':post_url}
    const event = new CustomEvent('uploadPolygons',{detail:send_data});
    // Dispatch the event to parent document.
    parent.document.dispatchEvent(event);

}

// if submitAndNext is for button type="submit", it will refresh the entire page
// if submitAndNext is for button type="button", it will not refresh the entire page

function submitAndNext(){
    let submitUrl = serUrl + `/${username}/submitImageObjects`;
    post_user_input(submitUrl).
    then(()=>{

        let img_name = document.getElementById('image_name').value;
        let savePolygonsUrl = serUrl + `/${username}/savePolygons/${img_name}`;
        post_save_edit_polygons(savePolygonsUrl);
    }).catch(error =>{ console.log(error)})
}

function get_previous_item(url){
    fetch(url).then(response =>{
        return response.json()
    }).then( img_info =>{
        if (img_info.image_name ==='NotAvailable'){
            alert('No previous image !')
            return;
        }
        // console.log('previous image info:',img_info)
        // image_name, possibility and notes
        document.getElementById('image_name').value = img_info.image_name;
        if (img_info.possibility != null){
            document.getElementById('objectPossibility').value = img_info.possibility;
        }
        if (img_info.user_note != null){
            document.getElementById('note').value = img_info.user_note;
        }

        // update other three panels
        update_three_panels(img_info)
    }).catch(error => console.log('get_previous_item failed', error))
}

function previousItem(){
    let current_image_name = document.getElementById('image_name').value;
    let previousUrl = serUrl + `/${username}/previous/${current_image_name}`;
    get_previous_item(previousUrl);
}

function NextItem(){
    alert("NextItem in infoFormEdit");
}