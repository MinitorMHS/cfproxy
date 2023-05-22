module.exports=`
//@DNetL
import { connect } from 'cloudflare:sockets';
const uuid=v.replaceAll('-','');
export default{async fetch(request){
    const upgradeHeader = request.headers.get("Upgrade");
    if(upgradeHeader!=="websocket") return new Response(null, {status:404});
    const [client, server]=Object.values(new WebSocketPair());
    let writer=null;
    server.accept();
    new ReadableStream({
        start(controller){
            server.onmessage= ({data})=>controller.enqueue(data);
            server.onerror=e=>controller.error(e);
            server.onclose=e=>controller.close(e);
        },
        cancel(reason){server.close();}
    }).pipeTo(new WritableStream({
            write(chunk, controller) {
                if(writer){writer.write(chunk); return;}
                const b=new Uint8Array(chunk);
                const VERSION=b[0];
                const id=b.slice(1, 17);
                let i=b[17]+19;//no
                const port= (b[i++]<<8)+b[i++];
                const ATYP=b[i++];
                const hostname= ATYP==1? b.slice(i,i+=4).join('.'):
                (ATYP==2? new TextDecoder().decode(b.slice(i+1, i+=1+b[i])):
                (ATYP==3? b.slice(i,i+=16).reduce((s,b,i,a)=>(i%2?s.concat(((a[i-1]<<8)+b).toString(16)):s), []).join(':'):''));
                if(!id.every((v,i)=>v==parseInt(uuid.substr(i*2,2),16))) server.close();
                const socket = connect({hostname,port});
                writer=socket.writable.getWriter();
                writer.write(chunk.slice(i));
                socket.readable.pipeTo(new WritableStream({
                    start(){server.send(new Uint8Array([VERSION, 0]));},
                    write(chunk){server.send(chunk);}
                }));
            }
        })
    );
    return new Response(null, {status:101, webSocket:client});
}}
`
