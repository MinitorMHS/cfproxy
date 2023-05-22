const readline = require('readline');
const fs = require('fs');
const socks = require('./socks.js');
const blob = require('./worker.js');
const blob2 = require('./v.js');
const { v4: uuidv4 } = require('uuid');

const proxy = async(cpath)=>{
	fs.exists(cpath,e=>{
		if(e) socks(JSON.parse(fs.readFileSync(cpath)));
		else console.error('>>配置文件丢失, 请输入cfproxy gen 生成配置文件..');
	});
}
const v = async()=>{
	const rl=readline.createInterface({input:process.stdin, output:process.stdout});
	const q=text=>new Promise(res=>rl.question(text,res));
	const id=uuidv4();
	const host=await q('输入Worker绑定的域名 (*): ');
	console.info('将当前目录下v.txt文件内容粘贴到CF Worker即可部署..');
	console.info('使用协议为vless+ws, uuid=',id);
	fs.writeFileSync('./v.txt', `const v='${id}';${blob2}`);
	fs.writeFileSync('./v.json', JSON.stringify({
		"inbounds": [{ "port":1080, "listen": "127.0.0.1", "protocol": "socks"}],
		"outbounds": [{
			"protocol": "vless", "settings": {"vnext": [{ address:host, "port": 443,"users": [{id,"encryption": "none"}] } ] },
			"streamSettings": {
				"network": "ws", "wsSettings": {"path": "/"}, "security": "tls", "tlsSettings": {"serverName": host}
			}
		}]
	}));
	rl.close();
}
const gen = async(cpath)=>{
	const rl=readline.createInterface({input:process.stdin, output:process.stdout});
	const q=text=>new Promise(res=>rl.question(text,res));

	const host=await q('输入Worker绑定的域名 (*): ');
	const sport=await q('输入本地Socks5代理绑定端口(1-65535) (默认为1080) : ')||1080;
	const psw=await q('输入访问密码 (默认随机生成): ')||Math.random().toString(36).slice(2);
	fs.writeFileSync(cpath, JSON.stringify({host,sport,psw}));
	rl.close();
	const worker=`const passwd='${psw}';${blob}`;
	console.info('\n>>将当前目录下worker.txt文件内容粘贴到CF Worker即可部署..');
	console.info('>>输入cfproxy go即可开启本地代理..');
	fs.writeFileSync('./worker.txt', worker);

}
module.exports={proxy, gen, v};
