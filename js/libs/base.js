// method
Function.prototype.method = function(name,func) {
	if (!this.prototype[name]) {
		this.prototype[name] = func;
		return this;
	}
};

// trace
if (!this.trace) {
	var trace = function trace(o) {
		if (window.console&&window.console.log) {
			var sTrace = "";
			if (arguments.length===1&&typeof(o)!=='string') {
				sTrace += o+"\n";
				for (var prop in o) {
					if (true) {
						sTrace += "\t"+prop+":\t"+String(o[prop]).split("\n")[0]+"\n";
					}
				}
			} else {
				for (var s in arguments) {
					if (typeof(arguments[s])!='function') {
						sTrace += " "+String(arguments[s]);
					}
				}
			}
			window.console.log(sTrace);
		}
	};
}

// int
if (!this.int) {
	var int = function(i) {
		return Math.round(i);
	};
}

// millis
if (!this.millis) {
	var millis = function() {
		return new Date().getTime();
	};
}

// addChild
if (!this.addChild) {
	var addChild = function(p,s) {
		var m = document.createElement(s);
		p.appendChild(m);
		return m;
	};
}

// FastRng
if (!this.Prng) {
	var Prng = function() {
		var iMersenne = 2147483647;
		var rnd = function(seed) {
			if (arguments.length) {
				that.seed = arguments[0];
			}
			that.seed = that.seed*16807%iMersenne;
			return that.seed;
		};
		var that = {
			seed: 123,
			rnd: rnd,
			random: function(seed) {
				if (arguments.length) {
					that.seed = arguments[0];
				}
				return rnd()/iMersenne;
			}
		};
		return that;
	}();
}