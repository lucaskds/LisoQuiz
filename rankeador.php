<html>
	<head>
		<meta charset="UTF-8">
		<title>Top 10!</title>
		<link rel="stylesheet" href="./ranking.css" type="text/css" />
		<script type='text/javascript' src='winwheel_1.2.js'></script>
	</head>
		<?php
			// get the q parameter from URL

			$nome=$_POST['nome'];
			$pontuacao=$_POST['pontuacao'];

			// lookup all hints from array if $q is different from ""
			if ($nome !== "")
			{
				$patfile = fopen("geral.dat", 'a+');
				$string = $pontuacao . "," . $nome . "\n";
				fwrite($patfile, $string);
				fclose($patfile);
			}else
			{
				$patfile = fopen("geral.dat", 'a+');
				$string = $pontuacao . "," . "Visitante" . "\n";
				fwrite($patfile, $string);
				fclose($patfile);
			}

			$linecount = 0;
			$handle = fopen("geral.dat", "r");
			$categories = array();
			while(!feof($handle)){
				$linha = fgets($handle);
				$line = explode(",", $linha);
				//novo
				//$categories = array($line[0] => $line[1])
				$var = array($line[0], $line[1]);
				array_push($categories, $var);
				$linecount++;
			}
			fclose($handle);
			$handle = fopen("ranking.dat", "w");

			function comparaPontuacao($a, $b) {
				return strnatcmp($a[0], $b[0]);
			} // sort alphabetically by name
				usort($categories, 'comparaPontuacao');

			$top10 = array();
			krsort($categories);
			foreach ($categories as $key => $value){
				if($categories[$key][0] != ""){
					array_push($top10, $categories[$key]);
					$string = $categories[$key][0] . "," . $categories[$key][1];
					fwrite($handle, $string);
				}
				else
					break;
			}
			fclose($handle);
			echo "<div class='top10_header'>TOP 10";
			echo "</div>";
			for($i = 0; $i < 10; $i++){
				echo "<div class='top10_posicao'>" . ($i+1) . "&ordm</div><div class='top10_info'>" . $top10[$i][1] . " (". $top10[$i][0] . " pontos)</div>";
			}
			echo "<div class='bordinha'></div>";
		?>
</html>