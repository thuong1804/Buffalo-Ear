const groups = [
  {
    name: "Nguyên âm đơn",
    type: "vowels",
    sounds: ["iː", "ɪ", "ʊ", "uː", "e", "ə", "ɜː", "ɔː", "æ", "ʌ", "ɑː", "ɒ"],
  },
  {
    name: "Nguyên âm đôi",
    type: "vowels",
    sounds: ["ɪə", "eɪ", "ʊə", "ɔɪ", "əʊ", "eə", "aɪ", "aʊ"],
  },
  {
    name: "Phụ âm",
    type: "consonants",
    sounds: [
      "p",
      "b",
      "t",
      "d",
      "k",
      "ɡ",
      "f",
      "v",
      "θ",
      "ð",
      "s",
      "z",
      "ʃ",
      "ʒ",
      "h",
      "tʃ",
      "dʒ",
      "m",
      "n",
      "ŋ",
      "l",
      "r",
      "j",
      "w",
    ],
  },
];
// Explicit phoneme tokens keep diphthongs and affricates distinct from their components.
const rawWords = [
  ["see", "s iː", "nhìn"],
  ["tree", "t r iː", "cây"],
  ["green", "ɡ r iː n", "xanh lá"],
  ["fish", "f ɪ ʃ", "cá"],
  ["sit", "s ɪ t", "ngồi"],
  ["milk", "m ɪ l k", "sữa"],
  ["book", "b ʊ k", "sách"],
  ["good", "ɡ ʊ d", "tốt"],
  ["foot", "f ʊ t", "bàn chân"],
  ["blue", "b l uː", "xanh dương"],
  ["food", "f uː d", "thức ăn"],
  ["moon", "m uː n", "mặt trăng"],
  ["bed", "b e d", "giường"],
  ["red", "r e d", "đỏ"],
  ["ten", "t e n", "mười"],
  ["about", "ə b aʊ t", "về"],
  ["bird", "b ɜː d", "chim"],
  ["girl", "ɡ ɜː l", "cô gái"],
  ["work", "w ɜː k", "làm việc"],
  ["door", "d ɔː", "cửa"],
  ["four", "f ɔː", "bốn"],
  ["walk", "w ɔː k", "đi bộ"],
  ["cat", "k æ t", "mèo"],
  ["apple", "æ p ə l", "táo"],
  ["black", "b l æ k", "đen"],
  ["cup", "k ʌ p", "cốc"],
  ["sun", "s ʌ n", "mặt trời"],
  ["love", "l ʌ v", "yêu"],
  ["car", "k ɑː", "xe hơi"],
  ["park", "p ɑː k", "công viên"],
  ["star", "s t ɑː", "ngôi sao"],
  ["dog", "d ɒ ɡ", "chó"],
  ["hot", "h ɒ t", "nóng"],
  ["clock", "k l ɒ k", "đồng hồ"],
  ["ear", "ɪə", "tai"],
  ["near", "n ɪə", "gần"],
  ["day", "d eɪ", "ngày"],
  ["rain", "r eɪ n", "mưa"],
  ["face", "f eɪ s", "khuôn mặt"],
  ["cure", "k j ʊə", "chữa trị"],
  ["boy", "b ɔɪ", "cậu bé"],
  ["coin", "k ɔɪ n", "đồng xu"],
  ["toy", "t ɔɪ", "đồ chơi"],
  ["go", "ɡ əʊ", "đi"],
  ["home", "h əʊ m", "nhà"],
  ["boat", "b əʊ t", "thuyền"],
  ["chair", "tʃ eə", "ghế"],
  ["hair", "h eə", "tóc"],
  ["light", "l aɪ t", "ánh sáng"],
  ["time", "t aɪ m", "thời gian"],
  ["five", "f aɪ v", "năm"],
  ["house", "h aʊ s", "nhà"],
  ["mouth", "m aʊ θ", "miệng"],
  ["now", "n aʊ", "bây giờ"],
  ["pen", "p e n", "bút"],
  ["bag", "b æ ɡ", "túi"],
  ["tea", "t iː", "trà"],
  ["van", "v æ n", "xe tải nhỏ"],
  ["think", "θ ɪ ŋ k", "suy nghĩ"],
  ["three", "θ r iː", "ba"],
  ["this", "ð ɪ s", "cái này"],
  ["they", "ð eɪ", "họ"],
  ["zoo", "z uː", "sở thú"],
  ["ship", "ʃ ɪ p", "tàu"],
  ["vision", "v ɪ ʒ ə n", "tầm nhìn"],
  ["measure", "m e ʒ ə", "đo lường"],
  ["hat", "h æ t", "mũ"],
  ["cheese", "tʃ iː z", "phô mai"],
  ["watch", "w ɒ tʃ", "đồng hồ đeo tay"],
  ["juice", "dʒ uː s", "nước ép"],
  ["job", "dʒ ɒ b", "công việc"],
  ["man", "m æ n", "người đàn ông"],
  ["name", "n eɪ m", "tên"],
  ["sing", "s ɪ ŋ", "hát"],
  ["long", "l ɒ ŋ", "dài"],
  ["yes", "j e s", "vâng"],
  ["wet", "w e t", "ướt"],
];
const extraWords = `
beach|b iː tʃ|bãi biển
bean|b iː n|đậu
beef|b iː f|thịt bò
bee|b iː|con ong
cheap|tʃ iː p|rẻ
clean|k l iː n|sạch
cream|k r iː m|kem
deep|d iː p|sâu
dream|d r iː m|giấc mơ
eat|iː t|ăn
feel|f iː l|cảm thấy
field|f iː l d|cánh đồng
free|f r iː|tự do
heat|h iː t|nhiệt
keep|k iː p|giữ
key|k iː|chìa khóa
leaf|l iː f|lá cây
leave|l iː v|rời đi
meet|m iː t|gặp
need|n iː d|cần
peace|p iː s|hòa bình
piece|p iː s|mảnh
please|p l iː z|làm ơn
read|r iː d|đọc (hiện tại)
sea|s iː|biển
seat|s iː t|chỗ ngồi
seed|s iː d|hạt giống
sheep|ʃ iː p|cừu
sleep|s l iː p|ngủ
speak|s p iː k|nói
speed|s p iː d|tốc độ
street|s t r iː t|đường phố
sweet|s w iː t|ngọt
team|t iː m|đội
teeth|t iː θ|răng (số nhiều)
week|w iː k|tuần
wheel|w iː l|bánh xe
big|b ɪ ɡ|to lớn
bill|b ɪ l|hóa đơn
bit|b ɪ t|một chút
bridge|b r ɪ dʒ|cây cầu
bring|b r ɪ ŋ|mang đến
build|b ɪ l d|xây dựng
busy|b ɪ z iː|bận rộn
chicken|tʃ ɪ k ɪ n|gà
city|s ɪ t iː|thành phố
click|k l ɪ k|nhấp chuột
drink|d r ɪ ŋ k|uống
give|ɡ ɪ v|cho
gift|ɡ ɪ f t|quà tặng
hill|h ɪ l|đồi
hit|h ɪ t|đánh
ill|ɪ l|ốm
inch|ɪ n tʃ|đơn vị inch
king|k ɪ ŋ|vua
kiss|k ɪ s|hôn
kit|k ɪ t|bộ dụng cụ
list|l ɪ s t|danh sách
live|l ɪ v|sống
miss|m ɪ s|nhớ
pick|p ɪ k|chọn
pink|p ɪ ŋ k|hồng
quick|k w ɪ k|nhanh
rich|r ɪ tʃ|giàu
ring|r ɪ ŋ|chiếc nhẫn
river|r ɪ v ə|sông
sick|s ɪ k|bị bệnh
six|s ɪ k s|sáu
skin|s k ɪ n|da
slim|s l ɪ m|mảnh mai
spring|s p r ɪ ŋ|mùa xuân
stick|s t ɪ k|cây gậy
still|s t ɪ l|vẫn
swim|s w ɪ m|bơi
thin|θ ɪ n|mỏng
ticket|t ɪ k ɪ t|vé
win|w ɪ n|chiến thắng
wind|w ɪ n d|gió
wish|w ɪ ʃ|ước
with|w ɪ ð|với
woman|w ʊ m ə n|phụ nữ
wood|w ʊ d|gỗ
wool|w ʊ l|len
cook|k ʊ k|nấu ăn
could|k ʊ d|có thể (quá khứ)
full|f ʊ l|đầy
look|l ʊ k|nhìn
pull|p ʊ l|kéo
push|p ʊ ʃ|đẩy
put|p ʊ t|đặt
should|ʃ ʊ d|nên
stood|s t ʊ d|đã đứng
took|t ʊ k|đã lấy
would|w ʊ d|sẽ (giả định)
boot|b uː t|ủng
choose|tʃ uː z|lựa chọn
cool|k uː l|mát
fruit|f r uː t|trái cây
glue|ɡ l uː|keo dán
group|ɡ r uː p|nhóm
lose|l uː z|thua
move|m uː v|di chuyển
pool|p uː l|hồ bơi
roof|r uː f|mái nhà
room|r uː m|phòng
school|s k uː l|trường học
shoe|ʃ uː|giày
soon|s uː n|sớm
soup|s uː p|súp
spoon|s p uː n|thìa
too|t uː|cũng
tool|t uː l|công cụ
tooth|t uː θ|răng
true|t r uː|đúng
two|t uː|hai
back|b æ k|phía sau
bad|b æ d|tệ
bank|b æ ŋ k|ngân hàng
bat|b æ t|con dơi
cap|k æ p|mũ lưỡi trai
cash|k æ ʃ|tiền mặt
catch|k æ tʃ|bắt
chat|tʃ æ t|trò chuyện
clap|k l æ p|vỗ tay
crab|k r æ b|cua
dad|d æ d|bố
fact|f æ k t|sự thật
fan|f æ n|quạt
fat|f æ t|béo
flag|f l æ ɡ|lá cờ
flat|f l æ t|căn hộ
glad|ɡ l æ d|vui mừng
grab|ɡ r æ b|nắm lấy
hand|h æ n d|bàn tay
hang|h æ ŋ|treo
happy|h æ p iː|hạnh phúc
have|h æ v|có
jacket|dʒ æ k ɪ t|áo khoác
jam|dʒ æ m|mứt
lamp|l æ m p|đèn
land|l æ n d|đất
map|m æ p|bản đồ
match|m æ tʃ|trận đấu
pan|p æ n|chảo
plan|p l æ n|kế hoạch
sad|s æ d|buồn
salad|s æ l ə d|rau trộn
sand|s æ n d|cát
snack|s n æ k|đồ ăn nhẹ
stamp|s t æ m p|tem
stand|s t æ n d|đứng
tap|t æ p|vòi nước
tax|t æ k s|thuế
track|t r æ k|đường chạy
travel|t r æ v ə l|du lịch
bagpipe|b æ ɡ p aɪ p|kèn túi
bell|b e l|chuông
belt|b e l t|thắt lưng
best|b e s t|tốt nhất
bread|b r e d|bánh mì
check|tʃ e k|kiểm tra
chest|tʃ e s t|ngực
dead|d e d|đã chết
desk|d e s k|bàn làm việc
dress|d r e s|váy
egg|e ɡ|trứng
end|e n d|kết thúc
fresh|f r e ʃ|tươi
friend|f r e n d|bạn bè
get|ɡ e t|nhận
guest|ɡ e s t|khách
head|h e d|đầu
health|h e l θ|sức khỏe
heavy|h e v iː|nặng
help|h e l p|giúp đỡ
left|l e f t|bên trái
leg|l e ɡ|chân
less|l e s|ít hơn
let|l e t|cho phép
men|m e n|những người đàn ông
mess|m e s|sự bừa bộn
neck|n e k|cổ
net|n e t|lưới
next|n e k s t|tiếp theo
pet|p e t|thú cưng
rest|r e s t|nghỉ ngơi
sell|s e l|bán
send|s e n d|gửi
seven|s e v ə n|bảy
shelf|ʃ e l f|kệ
shell|ʃ e l|vỏ sò
smell|s m e l|mùi
spell|s p e l|đánh vần
step|s t e p|bước
tell|t e l|kể
test|t e s t|bài kiểm tra
well|w e l|tốt
west|w e s t|phía tây
when|w e n|khi nào
bus|b ʌ s|xe buýt
brush|b r ʌ ʃ|bàn chải
but|b ʌ t|nhưng
come|k ʌ m|đến
cut|k ʌ t|cắt
done|d ʌ n|đã làm xong
duck|d ʌ k|vịt
dust|d ʌ s t|bụi
fun|f ʌ n|niềm vui
glove|ɡ l ʌ v|găng tay
gun|ɡ ʌ n|súng
hug|h ʌ ɡ|ôm
jump|dʒ ʌ m p|nhảy
just|dʒ ʌ s t|vừa mới
luck|l ʌ k|may mắn
lunch|l ʌ n tʃ|bữa trưa
much|m ʌ tʃ|nhiều
mud|m ʌ d|bùn
must|m ʌ s t|phải
nut|n ʌ t|hạt
one|w ʌ n|một
run|r ʌ n|chạy
shut|ʃ ʌ t|đóng
some|s ʌ m|một vài
son|s ʌ n|con trai
such|s ʌ tʃ|như vậy
touch|t ʌ tʃ|chạm
truck|t r ʌ k|xe tải
trust|t r ʌ s t|tin tưởng
young|j ʌ ŋ|trẻ
arm|ɑː m|cánh tay
art|ɑː t|nghệ thuật
bath|b ɑː θ|bồn tắm
calm|k ɑː m|bình tĩnh
card|k ɑː d|thẻ
class|k l ɑː s|lớp học
dark|d ɑː k|tối
dance|d ɑː n s|nhảy múa
farm|f ɑː m|nông trại
fast|f ɑː s t|nhanh
glass|ɡ l ɑː s|cốc thủy tinh
grass|ɡ r ɑː s|cỏ
hard|h ɑː d|khó
heart|h ɑː t|trái tim
large|l ɑː dʒ|lớn
last|l ɑː s t|cuối cùng
laugh|l ɑː f|cười
mark|m ɑː k|dấu
mask|m ɑː s k|khẩu trang
part|p ɑː t|phần
pass|p ɑː s|vượt qua
path|p ɑː θ|lối đi
sharp|ʃ ɑː p|sắc nhọn
smart|s m ɑː t|thông minh
start|s t ɑː t|bắt đầu
ask|ɑː s k|hỏi
box|b ɒ k s|hộp
cost|k ɒ s t|chi phí
cross|k r ɒ s|băng qua
drop|d r ɒ p|thả
fog|f ɒ ɡ|sương mù
frog|f r ɒ ɡ|ếch
got|ɡ ɒ t|đã nhận
lock|l ɒ k|khóa
lost|l ɒ s t|lạc
lot|l ɒ t|nhiều
not|n ɒ t|không
off|ɒ f|tắt
on|ɒ n|trên
pot|p ɒ t|nồi
rock|r ɒ k|đá
shop|ʃ ɒ p|cửa hàng
sock|s ɒ k|tất
soft|s ɒ f t|mềm
song|s ɒ ŋ|bài hát
spot|s p ɒ t|đốm
stop|s t ɒ p|dừng
strong|s t r ɒ ŋ|mạnh
top|t ɒ p|đỉnh
wrong|r ɒ ŋ|sai
all|ɔː l|tất cả
ball|b ɔː l|quả bóng
born|b ɔː n|được sinh ra
bought|b ɔː t|đã mua
call|k ɔː l|gọi
chalk|tʃ ɔː k|phấn
corn|k ɔː n|ngô
draw|d r ɔː|vẽ
fall|f ɔː l|rơi
floor|f l ɔː|sàn
fork|f ɔː k|dĩa
horse|h ɔː s|ngựa
law|l ɔː|luật
more|m ɔː|nhiều hơn
north|n ɔː θ|phía bắc
port|p ɔː t|cảng
short|ʃ ɔː t|ngắn
small|s m ɔː l|nhỏ
sport|s p ɔː t|thể thao
store|s t ɔː|cửa hàng
storm|s t ɔː m|bão
talk|t ɔː k|nói chuyện
tall|t ɔː l|cao
warm|w ɔː m|ấm
wall|w ɔː l|tường
world|w ɜː l d|thế giới
word|w ɜː d|từ
turn|t ɜː n|rẽ
third|θ ɜː d|thứ ba
shirt|ʃ ɜː t|áo sơ mi
skirt|s k ɜː t|chân váy
nurse|n ɜː s|y tá
learn|l ɜː n|học
hurt|h ɜː t|đau
first|f ɜː s t|đầu tiên
earth|ɜː θ|trái đất
burn|b ɜː n|cháy
cake|k eɪ k|bánh ngọt
date|d eɪ t|ngày tháng
eight|eɪ t|tám
game|ɡ eɪ m|trò chơi
gate|ɡ eɪ t|cổng
great|ɡ r eɪ t|tuyệt vời
late|l eɪ t|muộn
make|m eɪ k|làm
page|p eɪ dʒ|trang
paint|p eɪ n t|sơn
pay|p eɪ|trả tiền
place|p l eɪ s|nơi chốn
plane|p l eɪ n|máy bay
plate|p l eɪ t|đĩa
play|p l eɪ|chơi
safe|s eɪ f|an toàn
same|s eɪ m|giống nhau
save|s eɪ v|tiết kiệm
say|s eɪ|nói
shape|ʃ eɪ p|hình dạng
space|s p eɪ s|không gian
take|t eɪ k|lấy
train|t r eɪ n|tàu hỏa
wait|w eɪ t|chờ
wake|w eɪ k|thức dậy
way|w eɪ|cách
white|w aɪ t|trắng
why|w aɪ|tại sao
wide|w aɪ d|rộng
wife|w aɪ f|vợ
write|r aɪ t|viết
right|r aɪ t|đúng
rice|r aɪ s|gạo
ride|r aɪ d|đi xe
price|p r aɪ s|giá
night|n aɪ t|đêm
nice|n aɪ s|tốt đẹp
my|m aɪ|của tôi
mind|m aɪ n d|tâm trí
mile|m aɪ l|dặm
line|l aɪ n|dòng
like|l aɪ k|thích
life|l aɪ f|cuộc sống
kind|k aɪ n d|tử tế
ice|aɪ s|nước đá
high|h aɪ|cao
fly|f l aɪ|bay
fine|f aɪ n|ổn
find|f aɪ n d|tìm
drive|d r aɪ v|lái xe
dry|d r aɪ|khô
cry|k r aɪ|khóc
child|tʃ aɪ l d|đứa trẻ
bike|b aɪ k|xe đạp
bite|b aɪ t|cắn
buy|b aɪ|mua
bright|b r aɪ t|sáng
brown|b r aʊ n|nâu
cloud|k l aʊ d|mây
count|k aʊ n t|đếm
down|d aʊ n|xuống
found|f aʊ n d|đã tìm thấy
ground|ɡ r aʊ n d|mặt đất
how|h aʊ|như thế nào
loud|l aʊ d|ồn
mouse|m aʊ s|chuột
out|aʊ t|ra ngoài
round|r aʊ n d|tròn
shout|ʃ aʊ t|hét
sound|s aʊ n d|âm thanh
south|s aʊ θ|phía nam
town|t aʊ n|thị trấn
choice|tʃ ɔɪ s|sự lựa chọn
enjoy|ɪ n dʒ ɔɪ|thích thú
join|dʒ ɔɪ n|tham gia
noise|n ɔɪ z|tiếng ồn
oil|ɔɪ l|dầu
point|p ɔɪ n t|điểm
soil|s ɔɪ l|đất trồng
voice|v ɔɪ s|giọng nói
coat|k əʊ t|áo choàng
cold|k əʊ l d|lạnh
gold|ɡ əʊ l d|vàng
hope|h əʊ p|hy vọng
know|n əʊ|biết
low|l əʊ|thấp
most|m əʊ s t|nhiều nhất
no|n əʊ|không
nose|n əʊ z|mũi
note|n əʊ t|ghi chú
old|əʊ l d|cũ
own|əʊ n|sở hữu
phone|f əʊ n|điện thoại
road|r əʊ d|đường
rose|r əʊ z|hoa hồng
show|ʃ əʊ|cho xem
slow|s l əʊ|chậm
snow|s n əʊ|tuyết
soap|s əʊ p|xà phòng
stone|s t əʊ n|hòn đá
throw|θ r əʊ|ném
clear|k l ɪə|rõ ràng
dear|d ɪə|thân mến
fear|f ɪə|sợ hãi
hear|h ɪə|nghe
here|h ɪə|ở đây
year|j ɪə|năm
care|k eə|quan tâm
fair|f eə|công bằng
pair|p eə|đôi
share|ʃ eə|chia sẻ
wear|w eə|mặc
where|w eə|ở đâu
pure|p j ʊə|tinh khiết
`
  .trim()
  .split("\n")
  .map((line) => line.split("|"));
rawWords.push(...extraWords);
const words = rawWords.map(([word, phonemes, meaning]) => ({
  word,
  phonemes: phonemes.split(" "),
  ipa: phonemes.replaceAll(" ", ""),
  meaning,
}));
export { groups, words };
