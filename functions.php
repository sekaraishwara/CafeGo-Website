<?php 
/* koneksi ke database
	mysqli_connect("localhost", "root", "", "namaDatabase");
*/
	
$conn = mysqli_connect("localhost", "root", "", "mymap");

function query($query) {
	global $conn;
	$result = mysqli_query($conn, $query);
	$rows = [];
	while ($row = mysqli_fetch_assoc($result)) {
		$rows[] = $row;
	}
	return $rows;
}

function add($data) {
	global $conn;

	// ambil data dari tiap elemen
	$lat = $data["lat"];
	$lng = $data["lng"];
	$name = htmlspecialchars($data["name"]);
	$ratings = $data["ratings"];

	// query insert data
	$query = "INSERT INTO places VALUES (null, $lat, $lng, '$name', $ratings)";
	mysqli_query($conn, $query);

	return mysqli_affected_rows($conn);
}


?>