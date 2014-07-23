<!--<html>
	<head>
		
	</head>
	<body>
		<div>
			ranki
		</div>
	</body>
</html>
-->
<html>
<head>
	<meta charset="UTF-8">
		<link rel="shortcut icon" href="favicon.ico">
		<title>Ranking</title>
		<link rel="stylesheet" href="./ranking.css" type="text/css" />
		<script type='text/javascript' src='winwheel_1.2.js'></script>
</head>
<body>
	<div id="titulo" class="titulo_ranking">
		Será que você está no top10?
	</div>
	<div class="subtitulo_ranking">
		Insira seu nome para enviar a pontuação
	</div>
	<form name="form1" method="post" action="rankeador.php">
	<div class="form">
			<input id="nome_id" class="form" type="text" name="nome">
			<input id="hidden_value" type="hidden" name="pontuacao">
	</div>
	<div class="submit">
		<input type="submit" value="Enviar">
	</div>
	</form>
</body>
</html>