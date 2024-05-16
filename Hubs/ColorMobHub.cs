using Microsoft.AspNetCore.SignalR;

namespace ColorMob.Hubs
{    public class ColorMobHub : Hub
    {
        public async Task SendData( int x, int y, int idx, string uuid){
            var drawData = new {x=x,y=y,idx=idx,uuid=uuid};
            await Clients.Others.SendAsync("ReceiveData", drawData );
        }
    }
}