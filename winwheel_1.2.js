/*
Description:
	This script contains the functions to load the winning wheel image and do the rotation of it.
	By Douglas McKechie @ www.dougtesting.net
	
Version History:
	1.0 (2012-01-28)
	- Created based off earlier version.
	
	1.1 (2013-04-23, though not released before on my site)
	- Added "Prize Detection" feature which works out the prize the user has won when the wheel stops.
		As part of this I changed the wheel graphic to contain less segments so easier to understand.
	
	1.2 (2013-07-14)
	SIGNIFICANT UPDATE
	- Added "Pre-determined" feature which allows the result of the spin to be predetermined by a server side process,
		or other code, then when the wheel spins it will stop at this pre-determined location or prize rather than a random one.
	
		This required changes to the spinning code so instead of counting down until no rotations left it spins upwards
		until the target angle is met. Also needed to change the code that works out the power to just set the power level;
		the new startSpin() function sets the targetAngle based on the power.
	
	- Decided to improve the slowdown code by adjusting the way the thresholds that change the amount of angle rotated by are calculated.
		While doing this I hit on the idea of making the lower thresholds random between a specified range so is harder for user to 
		predict what they will win (which will could happen after playing the wheel a few times if the last threshold is always the same).
		
	- Added ability to reset the wheel by adding resetWheel() function. Called by click on link under spin button in example wheel.
	
	- Also overhauled the declaration of the global variables, moving ones that developers can alter to the top, and moving ones
		that should not be altered to seperate section. Also updated most of the comements describing what the variables do.
		
	- Added check that power level is selected before the wheel will spin (previously you could click Spin with no power selected) and
		also added variable to store the current state of the wheel - if spinning or not - so click of spin button while wheel is already 
		spinning has no effect.
*/

// --------------------------------
// VARIABLES YOU CAN ALTER...
var canvasId         = "myDrawingCanvas";   // Id of the canvas element on the page the wheel is to be rendered on.
var wheelImageName   = "./images/prizewheel.png";	// File name of the image for the wheel.
var spinButtonImgOn  = "./images/spin_on.png";		// Name / path to the images for the spin button.
var spinButtonImgOff = "./images/spin_off.png";
var theSpeed         = 20; 		 // Controls how often the spin function is called (is miliseconds value for animation timer).
var pointerAngle     = 0;  	 	 // The angle / location around the wheel where the pointer indicaing the prize is located. Can be any value you like, 0 is top (12 oclock) 180 is bottom (6 o'clock) etc.
var doPrizeDetection = true; 	 // Set to true if you want the code to detect the prize the user has won when the spinning has stopped. Prizes need to be specified in the prizes array.
var spinMode         = "random"; // Values can be: random, determinedAngle, determinedPrize.
var determinedGetUrl = "";  	 // Set to URL of the server-side process to load via ajax when spinMode is determinedAngle or determinedPrize.
var questao;
var rodou = false;
var rodada = 1;
var pontuacao = 0;
var streak = 0;
/*
	The following files included in the download can be used to test the different modes (you will need an Apache server; I use XAMPP on my local machine).
	determinedPrize: get_determined_prize.php;  // Always returns "2" (so will win prize 3).
	determinedAngle: get_determined_angle.php;	// Always returns "67" degrees (so will win prize 2 using example wheel prize start and end angles).
*/

// --------------------------------
// SPECIFY PRIZES (alter this too)...
// Add items to the array which correspond to the prizes in the segemnts of the wheel.
// The important properties are the startAngle and the endAngle in degrees, the name and anything else you want to add is optional.
// In order to work correctly the the start and end angles need to match the begining and end of the segments for the prizes in your wheel image.
// Thinking about a clock face, 0 is at the 12 o'clock, 90 is at the 3 o'clock, 180 is 6 o'clock, 270 is 9 o'clock.
var prizes = new Array();
prizes[0] = {"name" : "Lipídeos", "startAngle" : 0,   "endAngle" : 59, "color" : "#f0ff6f"};  // Note how prize end angle is 1 less than start angle of next prize so no overlap.
prizes[1] = {"name" : "Transformação de substâncias", "startAngle" : 60,  "endAngle" : 119, "color" : "#6fff8d"};
prizes[2] = {"name" : "Hormônio", "startAngle" : 120,  "endAngle" : 179, "color" : "#ffca6f"};
prizes[3] = {"name" : "Glicogênio", "startAngle" : 180, "endAngle" : 239, "color" : "#fd6fff"};
prizes[4] = {"name" : "Sobre o REL", "startAngle" : 240, "endAngle" : 299, "color" : "#6f8aff"};
prizes[5] = {"name" : "Cálcio", "startAngle" : 300, "endAngle" : 359, "color" : "#ff6f6f"};

var lipideos = [{
	"valida": 1,
	"question": "É um lipídeo de membrana:",
	"choices": ["Cerídeo", "Fosfolipídeo", "Glicerídeos", "Esteróides"],
	"correct": "Fosfolipídeo",
	"correctPos": 2
}, {
	"valida": 1,
	"question": "Qual opção a seguir não é função do lipídeo?",
	"choices": ["Constituir membrana", "Isolamento térmico", "Reserva de glicose", "Impermeabilidade"],
	"correct": "Reserva de glicose",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "Quem faz o transporte dos lipídeos para seus destinos após serem sintetizados no REL?",
	"choices": ["O próprio REL", "O REL", "O núcleo", "O complexo de Golgi"],
	"correct": "O complexo de Golgi",
	"correctPos": 4
}, {
	"valida": 1,
	"question": "Que doença abaixo está relacionada a lipídeos?",
	"choices": ["Hipertensão arterial", "Lúpus", "Artrite", "Câncer de mama"],
	"correct": "Hipertensão arterial",
	"correctPos": 1
}, {
	"valida": 1,
	"question": "Que compostos abaixo formam os lipídeos?",
	"choices": ["Nitrogênio, hidrogênio e oxigênio", "Carbono, hidrogênio e oxigênio", "Fósforo, hidrogênio e oxigênio", "Litio, hidrogênio e oxigênio"],
	"correct": "Carbono, hidrogênio e oxigênio",
	"correctPos": 2
}, {
	"valida": 1,
	"question": "Que itens abaixo são lipídeos?",
	"choices": ["Esfingomielina e colesterol", "Proteoglicanas e glicosaminoglicanas", "Alanina e valina", "Piruvato e oxaloacetato"],
	"correct": "Esfingomielina e colesterol",
	"correctPos": 1
}, {
	"valida": 1,
	"question": "Lipídeos possuem uma parte de sua estrutura necessariamente de natureza:",
	"choices": ["Sulfatada", "Glicolisada", "Hidrofóbica", "Hidrofílica"],
	"correct": "Hidrofóbica",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "Qual alimento abaixo é pobre em quantidade de lipídeo?",
	"choices": ["Alface", "Castanha", "Abacate", "Cevada"],
	"correct": "Alface",
	"correctPos": 1
}, {
	"valida": 1,
	"question": "O que são triacilgliceróis?",
	"choices": ["Carboidratos compostos por 1 molécula de glicerol e 3 cadeias de ácidos graxos", "Carboidratos compostos por 1 cadeia de ácido graxo e 3 moléculas de gliceróis", "Lipídeos compostos por  1 cadeia de ácido graxo e 3 moléculas de gliceróis", "Lipídeos compostos por 1 molécula de glicerol e 3 cadeias de ácidos graxos"],
	"correct": "Lipídeos compostos por 1 molécula de glicerol e 3 cadeias de ácidos graxos",
	"correctPos": 4
}, {
	"valida": 1,
	"question": "Lipídeos de mambrana são glicolisados no:",
	"choices": ["Retículo endoplasmático rugoso", "Retículo endoplasmático liso", "Complexo de Golgi", "Mitocôndria"],
	"correct": "Complexo de Golgi",
	"correctPos": 3
}];
var transformacao = [{
	"valida": 1,
	"question": "Um famoso antitussígeno deixou de ser usado pois ao chegar no REL era transformado em outra substância. Qual era essa substância?",
	"choices": ["Adrenalina", "Morfina", "Endorfina", "Acetilcolina"],
	"correct": "Acetilcolina",
	"correctPos": 4
}, {
	"valida": 1,
	"question": "O princípio geral da inativação de substâncias químicas consiste em transformar as moléculas ou substâncias lipossolúveis em compostos ionizáveis altamente...",
	"choices": ["Hidrofóbicos", "Apolares", "Hidrossolúveis", "Insolúveis"],
	"correct": "Hidrossolúveis",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "Como o REL age sobre certas substâncias?",
	"choices": ["As modifica ou destrói", "Somente modifica", "As modifica e depois destrói", "Somente destrói"],
	"correct": "As modifica ou destrói",
	"correctPos": 1
}, {
	"valida": 1,
	"question": "Por que é incorreto falar que o REL desintoxica o organismo?",
	"choices": ["Pois o termo correto é \"transformar substâncias\"", "Dependendo da substância ingerida ele pode torná-la tóxica", "Pois ele não faz de desintoxicação de todas as substâncias", "Todas as alternativas"],
	"correct": "Todas as alternativas",
	"correctPos": 4
}, {
	"valida": 1,
	"question": "De onde vem o REL quando há o abuso de drogas?",
	"choices": ["Da membrana plasmática", "O RER perde os ribossomos e vira REL", "O REL se divide formando cada vez mais REL", "Não há formação de REL"],
	"correct": "O REL se divide formando cada vez mais REL",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "Qual o principal órgão onde ocorre a transformação de substâncias?",
	"choices": ["Intestino", "Pâncreas", "Fígado", "Rim"],
	"correct": "Fígado",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "A ingestão de barbitúricos promove o aumento de REL em quais células?",
	"choices": ["Hepáticas", "Renais", "Linfócitos", "Basófilos"],
	"correct": "Hepáticas",
}, {
	"valida": 1,
	"question": "Qual destas substâncias aumenta a produção de REL?",
	"choices": ["Antibióticos", "Álcool", "Drogas", "Todas as anteriores"],
	"correct": "Todas as anteriores",
	"correctPos": 4
}, {
	"valida": 1,
	"question": "O que acontece com o REL quando se consome muitas drogas?",
	"choices": ["É degradado pela ação das drogas", "Ocorre produção acelerada de REL", "O REL faz com que a célula entre em apoptose", "A droga não tem contato com o REL"],
	"correct": "Ocorre produção acelerada de REL",
	"correctPos": 2
}];
var hormonio = [{
	"valida": 1,
	"question": "Por onde a maioria dos hormônios esteróides pode ser excretada?",
	"choices": ["Saliva", "Urina", "Sangue", "Respiração"],
	"correct": "Urina",
	"correctPos": 2
}, {
	"valida": 1,
	"question": "Qual o principal hormônio produzido nos testículos?",
	"choices": ["Testosterona", "Progesterona", "Estradiol", "Cortisona"],
	"correct": "Testosterona",
	"correctPos": 1
}, {
	"valida": 1,
	"question": "A testosterona é responsável pelo quê?",
	"choices": ["Crescimento do cabelo nas mulheres", "Quebra da molécula de glicose nos homens", "Desenvolvimento das características masculinas", "Aumentar nível de açúcar no sangue"],
	"correct": "Desenvolvimento das características masculinas",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "Quais as classes dos hormônios esteróides corretas?",
	"choices": ["Insulina, Glucagon e Testosterona", "Cortisol, Estradiol e Insulina", "Glucagon, Estradiol e Progesterona", "Testosterona, Cortisol e Estradiol"],
	"correct": "Testosterona, Cortisol e Estradiol",
	"correctPos": 4
}, {
	"valida": 1,
	"question": "É função do estrogênio:",
	"choices": ["Controlar a produção de espermatozóides", "Desenvolvimento sexual da mulher", "Auxilia o feto a desenvolver órgãos sexuais masculinos", "Nenhuma das anteriores"],
	"correct": "Desenvolvimento sexual da mulher",
	"correctPos": 2
}, {
	"valida": 1,
	"question": "Qual o efeito da progesterona?",
	"choices": ["Manter a secreção do endométrio", "Normalizar os níveis de açúcar no sangue", "Ajudar a prevenir o câncer", "Todas as alternativas anteriores"],
	"correct": "Manter a secreção do endométrio",
	"correctPos": 1
}, {
	"valida": 1,
	"question": "O uso indiscriminado de hormônios esteróides tem aumentado muito, principalmente entre os jovens, para:",
	"choices": ["Aumentar altura", "Diminuir quantidade de espinhas", "Clarear os dentes", "Aumentar massa muscular"],
	"correct": "Aumentar massa muscular",
	"correctPos": 4
}, {
	"valida": 1,
	"question": "Em quais órgãos ocorre a biossíntese de hormônios esteróides?",
	"choices": ["Pâncreas, Intestino e Coração", "Testículos, Estômago e Esôfago", "Ovários, Testículos e Córtex Renal", "Ovários, Rim e Pulmões"],
	"correct": "Ovários, Testículos e Córtex Renal",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "Onde o cortisol é produzido?",
	"choices": ["Membrana plasmática", "Glândula supra-renal", "Fígado", "Ovários"],
	"correct": "Glândula supra-renal",
	"correctPos": 2
}, {
	"valida": 1,
	"question": "Qual a molécula precursora dos hormônios esteróides?",
	"choices": ["Colesterol", "Proteínas", "DNA", "Glicose"],
	"correct": "Colesterol",
	"correctPos": 1
}];
var glicogenio = [{
	"valida": 1,
	"question": "O que deve acontecer com a glicose-6-fosfato para que ela passe para e matriz extracelular e para o sangue?",
	"choices": ["Convertê-la em glicose livre", "Fosforilar a glicose", "Formar glicogênio", "Ela não passa para a ME e nem para o sangue"],
	"correct": "Convertê-la em glicose livre",
	"correctPos": 1
}, {
	"valida": 1,
	"question": "A mobilização da glicose corresponde a várias etapas, uma delas tem como lugar o REL de quais células?",
	"choices": ["Hepatócitos", "Hemácias", "Linfócitos", "Mastócitos"],
	"correct": "Hepatócitos",
	"correctPos": 1
}, {
	"valida": 1,
	"question": "O que acontece com o glicogênio armazenado no músculo esquelético em exercício?",
	"choices": ["Permanece aprisionado na célula", "É consumido na glicólise", "Não passa para a corrente sanguínea", "Todas as alternativas"],
	"correct": "É consumido na glicólise",
	"correctPos": 2
}, {
	"valida": 1,
	"question": "Qual a principal enzima utilizada na mobilização da glicose?",
	"choices": ["Glicose-1-fosfatase", "Glicose-2-fosfatase", "Glicose-4-fosfatase", "Glicose-6-fosfatase"],
	"correct": "Glicose-6-fosfatase",
	"correctPos": 4
}, {
	"valida": 1,
	"question": "Qual o nome do processo em que o glicogênio é quebrado e forma glicose-1-fosfato pela glicogênio-fosforilase?",
	"choices": ["Glicogênese", "Gliconeogênese", "Glicogenólise", "Glicólise"],
	"correct": "Glicogenólise",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "Onde é armazenado a maior parte do glicogênio no organismo humano?",
	"choices": ["Cérebro", "Músculo esquelético", "Fígado", "Coração"],
	"correct": "Músculo esquelético",
	"correctPos": 2
}, {
	"valida": 1,
	"question": "Qual a proteína integral do REL?",
	"choices": ["Glicose-3-fosfatase", "Glicose-4-fosfatase", "Glicose-6-fosfatase", "Glicose-1-fosfatase"],
	"correct": "Glicose-6-fosfatase",
	"correctPos": 3
}];
var sobre = [{
	"valida": 1,
	"question": "É correto afirmar sobre RER e REL:",
	"choices": ["São organelas diferentes com funções iguais", "São organelas que são estruturalmente iguais, mas com funções diferentes", "São organelas que se comunicam, mas possuem funções diferentes", "São organelas que não se comunicam"],
	"correct": "São organelas que se comunicam, mas possuem funções diferentes",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "A membrana do REL é composta por:",
	"choices": ["Monocamada fosfolipídica", "Bicamada sulfatídica", "Monocamada sulfatídica", "Bicamada fosfolipídica"],
	"correct": "Bicamada fosfolipídica",
	"correctPos": 4
}, {
	"valida": 1,
	"question": "Que seres vivos não possuem REL?",
	"choices": ["Bactérias", "Protozoários", "Insetos", "Plantas"],
	"correct": "Protozoários",
	"correctPos": 2
}, {
	"valida": 1,
	"question": "Podemos dizer que, na célula, o REL localiza-se ao lado:",
	"choices": ["Do Retículo endoplasmático rugoso", "Da membrana plasmática", "Da mitocôndria", "Dos lisossomos"],
	"correct": "Do Retículo endoplasmático rugoso",
	"correctPos": 1
}, {
	"valida": 1,
	"question": "O que aconteceria se não existisse REL?",
	"choices": ["Não produziríamos hormônios e lipídeos", "Não produziríamos proteínas", "Não seriam transportadas vesículas para fora da célula", "Não teríamos energia"],
	"correct": "Não produziríamos hormônios e lipídeos",
	"correctPos": 1
}, {
	"valida": 1,
	"question": "O retículo endoplasmático liso caracteriza-se por:",
	"choices": ["Apresentar ribossomos aderidos", "Apresentar cisternas planas paralelas", "Apresentar túbulos irregulares", "Apresentar duas membranas, uma interna e outra externa"],
	"correct": "Apresentar túbulos irregulares",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "Não há abundância de REL em qual tipo de célula abaixo?",
	"choices": ["Células pancreáticas", "Células hepatócitas", "Células sanguíneas", "Células gonadais"],
	"correct": "Células sanguíneas",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "O REL também pode ser chamado de:",
	"choices": ["Retículo Granuloso", "Retículo Rugoso", "Retículo Golgiense", "Retículo Agranular"],
	"correct": "Retículo Agranular",
	"correctPos": 4
}, {
	"valida": 1,
	"question": "Onde localiza-se o REL?",
	"choices": ["Dentro da mitocôndria", "Dentro do núcleo", "No citoplasma", "Fora da célula"],
	"correct": "No citoplasma",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "Não é função do REL",
	"choices": ["Transformar substâncias", "Glicolisar lipídeos", "Participar da síntese de hormônios esteróides", "Desintoxicação celular"],
	"correct": "Glicolisar lipídeos",
	"correctPos": 2
}];
var calcio = [{
	"valida": 1,
	"question": "Como é classificado o cálcio na tabela periódica?",
	"choices": ["Metais alcalinos terrosos", "Metais alcalinos", "Metais de transição", "Não metais"],
	"correct": "Metais alcalinos terrosos",
	"correctPos": 1
}, {
	"valida": 1,
	"question": "Quais as outras funções do Ca2+ no organismo?",
	"choices": ["Atua na ativação da fosforilação oxidativa", "Auxilia a manutenção da integridade sarcolemal", "Ativa proteínas contráteis", "Todas as alternativas"],
	"correct": "Todas as alternativas",
	"correctPos": 4
}, {
	"valida": 1,
	"question": "Qual a importância do Ca2+?",
	"choices": ["Mensageiro de sinalização intercelular", "Mensageiro de sinalização intracelular", "Transportador de glicose", "Nenhuma das alternativas"],
	"correct": "Mensageiro de sinalização intercelular",
	"correctPos": 1
}, {
	"valida": 1,
	"question": "Onde a liberação de Ca2+ para o citosol é essencial para o mecanismo de contração das miofibrilas?",
	"choices": ["Músculo em seu estado normal", "No núcleo da célula", "Nas fibras musculares estriadas", "No REL"],
	"correct": "Nas fibras musculares estriadas",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "O que o REL faz com o Ca2+?",
	"choices": ["Sintetiza", "Armazena, capta e libera", "Transforma em outras substâncias", "Excreta para fora da célula"],
	"correct": "Armazena, capta e libera",
	"correctPos": 2
}, {
	"valida": 1,
	"question": "Onde o REL armazena Ca2+?",
	"choices": ["Pele", "Fígado", "Rim", "Músculo"],
	"correct": "Músculo",
	"correctPos": 4
}, {
	"valida": 1,
	"question": "Onde o cálcio é armazenado?",
	"choices": ["Sarcômero", "Sarcolema", "Retículo sarcoplasmático", "Nenhuma das alternativas"],
	"correct": "Retículo sarcoplasmático",
	"correctPos": 3
}, {
	"valida": 1,
	"question": "Qual o tipo de transporte é feito no acúmulo endomembranoso mediante a uma bomba de Ca2+?",
	"choices": ["Transporte ativo", "Transporte passivo", "Difusão simples", "Difusão facilitada"],
	"correct": "Transporte ativo",
	"correctPos": 1
}];

function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

shuffle(lipideos);
shuffle(transformacao);
shuffle(hormonio);
shuffle(glicogenio);
shuffle(sobre);
shuffle(calcio);
// Idea: an idea I had for this, but not implimented, is that if you wanted some the prizes / segments in your wheel to be "winners" and some to be "loosers"
// you could add a property to the items in the prize array stating if win/loose and then in the doSpin function code that is executed when the spinning has
// stopped display different message / play different sound (or whatever) depending on if the user has won or lost.

// --------------------------------
// VARIABLES THAT YOU DON'T NEED TO / SHOULD NOT CHANGE...
var surface;		   // Set to the drawing canvas object in the begin function.
var wheel;			   // The image of the face of the wheel is loaded in to an image object assigned to this var.
var angle 		 = 0;  // Populated with angle figured out by the threshold code in the spin function. You don't need to set this here.
var targetAngle  = 0;  // Set before spinning of the wheel begins by startSpin function depending on spinMode.
var currentAngle = 0;  // Used during the spin to keep track of current angle.
var power        = 0;  // Set when the power is selected. 1 for low, 2 for med, 3 for high.

// This is used to do ajax when using a determinedSpin mode and the value has not already been passed in via other method.
// Given that HTML canvas is not supported in IE6 or other old school browsers, we don't need to check if 
// XMLHttp request is available and fiddle around with creating activeX object etc.
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = ajaxCallback;

// This is set in the startSpin function to a random value within a range so that the last speed of the rotation of the wheel
// does not always happen at the same point before the prize the user will win. See comments in doSpin where this variable is located.
var randomLastThreshold = 150;

// Pointer to the setTimout for the call to the doSpin function. Is global var so can clear the timeout if reset is clicked before wheel has stopped spinning.
var spinTimer;

// Used to track status of the wheel, set to 'spinning' when the wheel is spinning.
// Only used in this code to stop the spin button working again while the wheel is currently spinning, you could use in your project for additional things.
// Note: spin button will only work again after wheel has been reset.
var wheelState = 'reset';

// ==================================================================================================================================================
// This function is called by the code on the page after loading. It gets the canvas and loads the wheel image.
// ==================================================================================================================================================

function begin() 
{
	// Get our Canvas element
	surface = document.getElementById(canvasId);
	// If canvas is supported then load the image.
	if (surface.getContext) 
	{
		wheel = new Image();
		wheel.onload = initialDraw;		// Once the image is loaded from file this function is called to draw the image in its starting position.
		wheel.src = wheelImageName;
	}
	document.getElementById("next_round_div").addEventListener('click', function() {
		   resetWheel();
		}, false);
}

function criaTabela(){
		for(i = 1; i < 5; i++){
		var id = "caixa_opcao" + i;
		//if(rodou)
			
		document.getElementById(id).onmouseover = function() {
		    if(rodou){
		    	document.getElementById(this.id).style.cursor = 'pointer';
		    	this.style.backgroundColor = "yellow";
		    }
		};
		document.getElementById(id).onmouseout = function() {
			if(rodou){
		    	this.style.backgroundColor = "white";
		    }
		};
		document.getElementById(id).addEventListener('click', function() {
		    if(rodou){
			    if(document.getElementById(this.id.substr(6, 13)).innerHTML == questao['correct']){
			    	document.getElementById('correct').play();
			    	rodou = false;
			    	this.style.backgroundColor = "#6fff8d";
			    	pontuacao += 1 + streak;
			    	atualizaPlacar();
			    	streak++;
			    }
			    else {
			    	document.getElementById('wrong').play();
    				rodou = false;
    				var innerId = "caixa_opcao" + questao['correctPos'];
    				document.getElementById(innerId).style.backgroundColor = "#6fff8d";
    				this.style.backgroundColor = "#ff6f6f";
    				streak = 0;
			    }
			}
		}, false);
	}
}

// ==================================================================================================================================================
// This function draws the wheel on the canvas in its intial position. Without it only the background would be displayed.
// ==================================================================================================================================================
function initialDraw(e)
{
	var surfaceContext = surface.getContext('2d');
	surfaceContext.drawImage(wheel, 0, 0);
}

// ==================================================================================================================================================
// This function is called when the spin button is clicked, it works out the targetAngle using the specified spin mode, then kicks off the spinning.
// ==================================================================================================================================================
function startSpin(determinedValue)
{
	// This is the angle (0-360) around the wheel that is to be positioned where the pointer is located when the wheel stops.
	// For example if pointer is located at 0 degrees (12 o'clock) and stopAngle is 67 degrees then the prize located at 67
	// degrees will be pointed to when the wheel stops.
	var stopAngle = undefined;	
	
	// Based on spin mode set stopAngle differently.
	if (spinMode == "random")
	{
		// In this mode where the wheel stops is to be random, so get a random whole number between 0 and 360 degrees.
		stopAngle = Math.floor(Math.random() * 360);
	}
	else if (spinMode == "determinedAngle")
	{
		// In this mode the angle (0-360) degrees is pre-determined somehow, such as by a server side process called via AJAX etc.
		// The server side process should return the angle which is a value 0-360 degrees. Ideally this value should be a whole number
		// though decimal numbers (45.5 etc) are possible, but you will need to alter the last threshold in the spin code changing the
		// angle to 0.5 so that there is no possibility that the spinning code will overshoot the target angle.
		// This is only an issue if the specified angle is right on the border between 2 segments / prizes.
		
		// In order to preserve the ablity of this winwheel code not requiring any other javascript libraries (such as jQuery) we
		// must do our own ajax / XMLRequest stuff. If you like jquery and want to use it, you could bind to the spin button's click event
		// to do a $.get() and then simply pass the value returned by the ajax appropriate for the spinMode in to this function.
		if (typeof(determinedValue) === 'undefined')
		{
			// So determinedValue is has not been passed in, do an request then to the specified determinedGetUrl.
			if (determinedGetUrl)
			{
				xhr.open('GET', determinedGetUrl, true);
				xhr.send('');
				
				// The request will come back to the ajaxCallback() function below and if all good it will 
				// then call this function again passing the determinedValue in.
			}
		}
		else
		{
			// The determinedValue is specified, in this case we know it is an angle (well it should be) so set stopAngle to it.
			stopAngle = determinedValue;
		}
	}
	else if (spinMode == "determinedPrize")
	{	
		// Again if determined value is undefined then do the GET to the dertmined url.
		if (typeof(determinedValue) === 'undefined')
		{
			// So determinedValue is has not been passed in, do an request then to the specified determinedGetUrl.
			if (determinedGetUrl)
			{
				xhr.open('GET', determinedGetUrl, true);
				xhr.send('');
			}
		}
		else
		{
			// The determined value is specified. In this case it is the prize the user is to win so it is just a number representing the item in the prize array.
			// For example if the user is to win prize 3 then "2" will be retruned (as arrays start at 0 price 3 is in #2 spot of prizes array).
			
			// Because the determinedValue is the number of the prize in the prizes array, we cannot simply make the stopAngle this value, so
			// make the stopAngle a random value between the startAngle and endAngle of the prize so when the wheel stops the pointer is pointing to
			// a random place inside the segment displaying the prize (random inside is nicer than always dead center).
			stopAngle = Math.floor(prizes[determinedValue]['startAngle'] + (Math.random() * (prizes[determinedValue]['endAngle'] - prizes[determinedValue]['startAngle'])));
		}
	}
	
	// ------------------------------------------
	// If stopAngle defined then we have the information we need to work out final things such as the targetAngle and then kick off the spinning of the wheel.
	// Only do this if the wheel is in fresh state (not curently spinning or has stopped after a spin) and the power has been selected.
	if ((typeof(stopAngle) !== 'undefined') && (wheelState == 'reset') && (power))
	{
		// Ok. So we have the stopAngle, but in order to make the prize at that location pointed to by the pointer that indicates the prize we
		// need to adjust the value taking in to account the location of the pointer.
		// This is the location of pointer, minus the stopAngle. 360 is added to ensure that value is not negative.
		stopAngle = (360 + pointerAngle) - stopAngle;
		
		// Now that is sorted we have to set the targetAngle of the wheel. Once the spinning is started it will keep going until the targetAngle is met.
		// This value needs to be based on the power and have the stopAngle added to it. Basically more power the larger the targetAngle needs to be.
		targetAngle = (360 * (power * 6) + stopAngle);
		
		// Also set the randomLastThreshold to a value between 90 and 180 so that user cannot always tell what prize they will win before the wheel
		// stops, which is the case if the last threshold is always the same as the user can see the wheel slow to 1 degree of rotation the same 
		// distance before it stops each time. See further comments in doSpin function where this is used.
		randomLastThreshold = Math.floor(90 + (Math.random() * 90));
		
		// Set Spin button image back to disabled one, since can't click again until the wheel is reset.
		document.getElementById('spin_button').src       = spinButtonImgOff;
		document.getElementById('spin_button').className = "";
		
		// Now kick off the spinning of the wheel by calling the doSpin function.
		wheelState = 'spinning';
		doSpin();
	}
}

// ==================================================================================================================================================
// This function is used when doing a XMLHttpRequest to check the ready state and if got response then process it.
// ==================================================================================================================================================
function ajaxCallback()
{
	if (xhr.readyState < 4)
	{
		return;
	}
	
	// Note: You might want to add some code to deal with when get error response such as notify the user to try again etc.
	if (xhr.status !== 200)
	{
		return;
	}
	
	// If code got this far we know all is well, so call startSpin function passing the response to it (which should be angle or prize).
	// If you need to pass multiple parameters back from the server site process I would look in to doing some JSON then decoding it here.
	startSpin(xhr.responseText);
}

// ==================================================================================================================================================
// This function actually rotates the image making it appear to spin, a timer calls it repeatedly to do the animation.
// The wheel rotates until the currentAngle meets the targetAngle, slowing down at certain thresholds to give a nice effect.
// ==================================================================================================================================================
function doSpin() 
{	
	// Grab the context of the canvas.
	var surfaceContext = surface.getContext('2d');

	// Save the current context - we need this so we can restore it later.
	surfaceContext.save();
	
	// Translate to the center point of our image.
	surfaceContext.translate(wheel.width * 0.5, wheel.height * 0.5);
	
	// Perform the rotation by the angle specified in the global variable (will be 0 the first time).
	surfaceContext.rotate(DegToRad(currentAngle));
	
	// Translate back to the top left of our image.
	surfaceContext.translate(-wheel.width * 0.5, -wheel.height * 0.5);
	
	// Finally we draw the rotated image on the canvas.
	surfaceContext.drawImage(wheel, 0, 0);
	
	// And restore the context ready for the next loop.
	surfaceContext.restore();

	// ------------------------------------------
	// Add angle worked out below by thresholds to the current angle as we increment the currentAngle up until the targetAngle is met.
	currentAngle += angle;
	
	// ------------------------------------------
	// If the currentAngle is less than targetAngle then we need to rotate some more, so figure out what the angle the wheel is to be rotated 
	// by next time this function is called, then set timer to call this function again in a few milliseconds.
	if (currentAngle < targetAngle)
	{
		// We can control how fast the wheel spins by setting how much is it to be rotated by each time this function is called.
		// In order to do a slowdown effect, we start with a high value when the currentAngle is further away from the target
		// and as it is with certian thresholds / ranges of the targetAngle reduce the angle rotated by - hence the slowdown effect.
		
		// The 360 * (power * 6) in the startSpin function will give the following...
		// HIGH power = 360 * (3 * 6) which is 6480
		// MED power = 360 * (2 * 6) which equals 4320
		// LOW power = 360 * (1 * 6) equals 2160.
		
		// Work out how much is remaining between the current angle and the target angle.
		var angleRemaining = (targetAngle - currentAngle);
		
		// Now use the angle remaining to set the angle rotated by each loop, reducing the amount of angle rotated by as
		// as the currentAngle gets closer to the targetangle.
		if (angleRemaining > 6480)
			angle = 55;
		else if (angleRemaining > 5000)		// NOTE: you can adjust as desired to alter the slowdown, making the stopping more gradual or more sudden.
			angle = 45;						// If you alter the forumla used to work out the targetAngle you may need to alter these.
		else if (angleRemaining > 4000)
			angle = 30;
		else if (angleRemaining > 2500)
			angle = 25;
		else if (angleRemaining > 1800)
			angle = 15;
		else if (angleRemaining > 900)
			angle = 11.25;
		else if (angleRemaining > 400)
			angle = 7.5;
		else if (angleRemaining > 220)					// You might want to randomize the lower threhold numbers here to be between a range
			angle = 3.80;								// otherwise if always within last 150 when the speed is set to 1 degree the user can
		else if (angleRemaining > randomLastThreshold)	// tell what prize they will win before the wheel stops after playing the wheel a few times.
			angle = 1.90;								// This variable is set in the startSpin function. Up to you if you want to randomise the others.
		else
			angle = 1;		// Last angle should be 1 so no risk of the wheel overshooting target if using preDetermined spin mode 
							// (only a problem if pre-Determined location is near edge of a segment).
		
		// Set timer to call this function again using the miliseconds defined in the speed global variable.
		// This effectivley gets creates the animation / game loop.
		
		// IMPORTANT NOTE: 
		// Since creating this wheel some time ago I have learned than in order to do javascript animation which is not affected by the speed at which 
		// a device can exectute javascript, a "frames per second" approach with the javscript function requestAnimationFrame() should be used. 
		// I have not had time to learn about and impliment it here, so you might want to look in to it if this method of animation is not 
		// smooth enough for you.
		spinTimer = setTimeout("doSpin()", theSpeed);
	}
	else
	{
		// currentAngle must be the same as the targetAngle so we have reached the end of the spinning.
		
		// Update this to indicate the wheel has finished spinning.
		// Not really used for anything in this example code, but you might find keeping track of the wheel state in a game you create
		// is handy as you can check the state and do different things depending on it (reset, spinning, won, lost etc).
		wheelState = 'stopped';
		
		// If to do prize dection then work out the prize pointed to.
		if ((doPrizeDetection) && (prizes))
		{
			// Get how many times the wheel has rotated past 360 degrees.
			var times360 = Math.floor(currentAngle / 360);
			
			// From this compute the angle of where the wheel has stopped - this is the angle of where the line between 
			// segment 8 and segment 1 is because this is the 360 degree / 0 degree (12 o'clock) boundary when then wheel first loads.
			var rawAngle = (currentAngle - (360 * times360));
			
			// The value above is still not quite what we need to work out the prize.
			// The angle relative to the location of the pointer needs to be figured out.
			var relativeAngle =  Math.floor(pointerAngle - rawAngle);
			
			if (relativeAngle < 0)
				relativeAngle = 360 - Math.abs(relativeAngle);
			
			// Now we can work out the prize won by seeing what prize segment startAngle and endAngle the relativeAngle is between.
			for (x = 0; x < (prizes.length); x ++)
			{
				if ((relativeAngle >= prizes[x]['startAngle']) && (relativeAngle <= prizes[x]['endAngle']))
				{	
					document.getElementById( 'questions' ).style.backgroundColor = prizes[x]['color'];
					var i = 0;
					switch(x){
						case 0:
							while(lipideos[i]['valida'] == 0)
								i++;
							document.getElementById( 'pergunta' ).innerHTML = lipideos[i]['question'];
							document.getElementById( 'opcao1' ).innerHTML = lipideos[i].choices[0];
							document.getElementById( 'opcao2' ).innerHTML = lipideos[i].choices[1];
							document.getElementById( 'opcao3' ).innerHTML = lipideos[i].choices[2];
							document.getElementById( 'opcao4' ).innerHTML = lipideos[i].choices[3];
							questao = lipideos[i];
							lipideos[i]['valida'] = 0;
							break;
						case 1:
							while(transformacao[i]['valida'] == 0)
								i++;
							document.getElementById( 'pergunta' ).innerHTML = transformacao[i]['question'];
							document.getElementById( 'opcao1' ).innerHTML = transformacao[i].choices[0];
							document.getElementById( 'opcao2' ).innerHTML = transformacao[i].choices[1];
							document.getElementById( 'opcao3' ).innerHTML = transformacao[i].choices[2];
							document.getElementById( 'opcao4' ).innerHTML = transformacao[i].choices[3];
							questao = transformacao[i];
							transformacao[i]['valida'] = 0;
							break;
						case 2:
							while(hormonio[i]['valida'] == 0)
								i++;
							document.getElementById( 'pergunta' ).innerHTML = hormonio[i]['question'];
							document.getElementById( 'opcao1' ).innerHTML = hormonio[i].choices[0];
							document.getElementById( 'opcao2' ).innerHTML = hormonio[i].choices[1];
							document.getElementById( 'opcao3' ).innerHTML = hormonio[i].choices[2];
							document.getElementById( 'opcao4' ).innerHTML = hormonio[i].choices[3];
							questao = hormonio[i];
							hormonio[i]['valida'] = 0;
							break;
						case 3:
							while(glicogenio[i]['valida'] == 0)
								i++;
							document.getElementById( 'pergunta' ).innerHTML = glicogenio[i]['question'];
							document.getElementById( 'opcao1' ).innerHTML = glicogenio[i].choices[0];
							document.getElementById( 'opcao2' ).innerHTML = glicogenio[i].choices[1];
							document.getElementById( 'opcao3' ).innerHTML = glicogenio[i].choices[2];
							document.getElementById( 'opcao4' ).innerHTML = glicogenio[i].choices[3];
							questao = glicogenio[i];
							glicogenio[i]['valida'] = 0;
							break;
						case 4:
							while(sobre[i]['valida'] == 0)
								i++;
							document.getElementById( 'pergunta' ).innerHTML = sobre[i]['question'];
							document.getElementById( 'opcao1' ).innerHTML = sobre[i].choices[0];
							document.getElementById( 'opcao2' ).innerHTML = sobre[i].choices[1];
							document.getElementById( 'opcao3' ).innerHTML = sobre[i].choices[2];
							document.getElementById( 'opcao4' ).innerHTML = sobre[i].choices[3];
							questao = sobre[i];
							sobre[i]['valida'] = 0;
							break;
						case 5:
							while(calcio[i]['valida'] == 0)
								i++;
							document.getElementById( 'pergunta' ).innerHTML = calcio[i]['question'];
							document.getElementById( 'opcao1' ).innerHTML = calcio[i].choices[0];
							document.getElementById( 'opcao2' ).innerHTML = calcio[i].choices[1];
							document.getElementById( 'opcao3' ).innerHTML = calcio[i].choices[2];
							document.getElementById( 'opcao4' ).innerHTML = calcio[i].choices[3];
							questao = calcio[i];
							calcio[i]['valida'] = 0;
							break;
					}
				break;
				}

			}
			
		}
		rodou = true;
		// ADD YOUR OWN CODE HERE.
		// If no prize detection then up to you to do whatever you want when the spinning has stopped.
	}
}

// ==================================================================================================================================================
// Quick little function that converts the degrees to radians.
// ==================================================================================================================================================
function DegToRad(d) 
{
	return d * 0.0174532925199432957;
}

// ==================================================================================================================================================
// This function sets the class name of the power TDs to indicate what power has been selected, and also sets power variable used by startSpin code.
// It is called by the onClick of the power table cells on the page. 
// ==================================================================================================================================================
function powerSelected(powerLevel)
{
	// In order to stop the change of power duing the spinning, only do this if the wheel is in a reset state.
	if (wheelState == 'reset')
	{
		// Reset all to grey incase this is not the first time the user has selected the power.
		document.getElementById('pw1').className = "";
		document.getElementById('pw2').className = "";
		document.getElementById('pw3').className = "";
		
		// Now light up all cells below-and-including the one selected by changing the class.
		if (powerLevel >= 1)
			document.getElementById('pw1').className = "pw1";
			
		if (powerLevel >= 2)
			document.getElementById('pw2').className = "pw2";
			
		if (powerLevel >= 3)
			document.getElementById('pw3').className = "pw3";
		
		// Set internal power variable.
		power = powerLevel;
		
		// Light up the spin button by changing it's source image and adding a clickable class to it.
		document.getElementById('spin_button').src = spinButtonImgOn;
		document.getElementById('spin_button').className = "clickable";
	}
}

function atualizaPlacar() {
	document.getElementById("rodada_valor").innerHTML = rodada;
	document.getElementById("pontos_valor").innerHTML = pontuacao;
}

function pontuar(){
	return pontuacao;
}

function openpop() {
	
	alert("pontos" + popup.opener.document.getElementById("pontos_valor").innerHTML + "\nhidden: " + popup.document.getElementById("hidden_value").value);
	//OpenWindow.document.close();
	//self.name="main";
} 

// ==================================================================================================================================================
// This function re-sets all vars as re-draws the wheel at the original position. Also re-sets the power and spin buttons on the example wheel.
// ==================================================================================================================================================
function resetWheel()
{
	// Ensure that if wheel is spining then it is stopped.
	if(rodada<7){
		clearTimeout(spinTimer);
		
		// Re-set all vars to do with spinning angles.
		angle 		 = 0;
		targetAngle  = 0;
		currentAngle = 0;
		power        = 0;
		
		// Update styles of power buttons so they appear grey again.
		document.getElementById('pw1').className = "";
		document.getElementById('pw2').className = "";
		document.getElementById('pw3').className = "";
		
		// Make spin button disabled again until power is selected.
		document.getElementById('spin_button').src       = spinButtonImgOff;
		document.getElementById('spin_button').className = "";
		
		// Set back to reset so that power selection and click of Spin button work again.
		wheelState = 'reset';
		
		// Call function to draw wheel in start-up position.
		initialDraw();
		rodou = false;
		rodada++;
		atualizaPlacar();
		document.getElementById("caixa_opcao1").style.backgroundColor = "white";
		document.getElementById("caixa_opcao2").style.backgroundColor = "white";
		document.getElementById("caixa_opcao3").style.backgroundColor = "white";
		document.getElementById("caixa_opcao4").style.backgroundColor = "white";
	}
	else{
		document.getElementById('end').play();
		var popup = window.open("ranking.html", "childWindow", "height=400, width=280");
		//alert("FIM DE JOGO!!");
	}
}
