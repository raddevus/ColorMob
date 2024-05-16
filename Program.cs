using Microsoft.AspNetCore.Http.HttpResults;
using ColorMob.Hubs;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRazorPages();
builder.Services.AddSignalR();
var app = builder.Build();

app.MapGet("~/", () => Results.Redirect("~/index.htm"));

app.UseStaticFiles();
app.UseDefaultFiles();
app.MapHub<ColorMob.Hubs.ColorMobHub>("/colorMobHub");
app.Run();

