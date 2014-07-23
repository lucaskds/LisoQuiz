<?php
// get the q parameter from URL

$nome=$_POST['nome'];
$pontuacao=$_POST['pontuacao'];

// lookup all hints from array if $q is different from ""
if ($nome !== "")
{
	$patfile = fopen("ranking.dat", 'a+');
	$string = $pontuacao . ", " . $nome . "\n";
	echo $string;
	fwrite($patfile, $string);
	fclose($patfile);
}else
{
	$patfile = fopen("ranking.dat", 'a+');
	$string = $pontuacao . ", " . "Visitante" . "\n";
	echo $string;
	fwrite($patfile, $string);
	fclose($patfile);
}

?> 