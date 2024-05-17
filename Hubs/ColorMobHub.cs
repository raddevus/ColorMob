using Microsoft.AspNetCore.SignalR;

namespace ColorMob.Hubs
{    public class ColorMobHub : Hub
    {
        public async Task SendData( int x, int y, int idx, string uuid){
            var drawData = new {x=x,y=y,idx=idx,uuid=uuid};
            await Clients.Others.SendAsync("ReceiveData", drawData );
        }

        public async Task SendSquares(int x, int y, string fill, string uuid){
            var square = new {x=x,y=y,fill=fill,uuid=uuid};
            await Clients.Others.SendAsync("ReceiveSquareData", square);
        }
    }
}