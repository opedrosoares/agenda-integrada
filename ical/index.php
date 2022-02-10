<?php
/* Configurações PHP */
error_reporting(E_ALL);
ini_set('display_errors', '1');
setlocale(LC_MONETARY,"pt_BR", "ptb");
setlocale(LC_ALL, 'pt_BR', 'pt_BR.utf-8', 'pt_BR.utf-8', 'portuguese');
setlocale(LC_TIME, 'pt_BR', 'pt_BR.utf-8', 'pt_BR.utf-8', 'portuguese');
date_default_timezone_set('America/Sao_Paulo');

header("Access-Control-Allow-Origin: *"); 
header('Content-Type: application/json');

include 'ical.php';

/* Web access */
if(empty($_GET['url'])) {
	echo "API - Agendada Integrada";
	return;
} else {
	$file = filter_var($_GET['url'], FILTER_SANITIZE_URL);
	$date = (!empty($_GET['date'])) ? filter_var($_GET['date'], FILTER_SANITIZE_URL) : false;
}

$iCal = new iCal($file);

$events = ($date) ? $iCal->eventsByDateBetween($date, $date) : $iCal->eventsByDate();

/* Output */
echo json_encode($events);

?>