"""Build a compact, fully offline study dataset from pinned, attributed sources."""
import json
import re
import sqlite3
from collections import Counter
from pathlib import Path
import shutil
import gzip

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache' / 'vocabulary'
DATA = ROOT / 'data'
legacy_file = DATA / 'legacy.json'
if not legacy_file.exists():
    shutil.copyfile(CACHE / 'legacy.json', legacy_file)
legacy = {w['word']: w for w in json.loads(legacy_file.read_text('utf-8'))}
level_map = {}
pos_map = {}
for level in ['A1', 'A2', 'B1', 'B2']:
    for entry in json.loads((CACHE / f'cefr/public/data/{level}.json').read_text('utf-8')):
        word = entry['word'].lower()
        if word not in level_map:
            level_map[word] = level
            pos_map[word] = entry.get('pos', [])

# Explicit editorial levels for legacy items absent from the source list.
editorial = dict(line.split('|') for line in '''light|A1
zoo|A1
vision|B2
teeth|A1
kit|B1
slim|B1
stick|B1
stood|A2
took|A1
glue|A2
bank|A1
bat|B1
clap|B1
crab|B1
match|A1
snack|A2
tap|B1
bagpipe|B2
men|A1
rest|A1
done|A1
duck|A2
hug|B1
last|A1
mask|B1
fog|A2
got|A1
rock|A2
bought|A1
chalk|A2
like|A1
kind|A1
rose|B1'''.splitlines())

# Manual corrections for missing/ambiguous source entries; reviewed for this app.
manual = {}
for line in '''cd|ˌsiːˈdiː|đĩa CD
girlfriend|ˈɡɜːlfrend|bạn gái
grandparent|ˈɡrænpeərənt|ông hoặc bà
his|hɪz|của anh ấy
machine|məˈʃiːn|máy móc
my|maɪ|của tôi
no one|nəʊwʌn|không ai
off|ɒf|tắt; rời khỏi
ok|əʊˈkeɪ|ổn; được
the|ðə|mạo từ xác định
which|wɪtʃ|cái nào
white|waɪt|màu trắng
why|waɪ|tại sao
yourself|jɔːˈself|chính bạn
app|æp|ứng dụng
hers|hɜːz|của cô ấy
ourselves|aʊəˈselvz|chính chúng tôi
single|ˈsɪŋɡəl|đơn lẻ; độc thân
stove|stəʊv|bếp nấu
teenage|ˈtiːneɪdʒ|thuộc tuổi thiếu niên
used to|ˈjuːstə|đã từng; thường làm trước đây
whose|huːz|của ai
colored|ˈkʌləd|có màu
fur|fɜː|bộ lông thú
located|ləʊˈkeɪtɪd|nằm ở; tọa lạc
ours|aʊəz|của chúng tôi
shy|ʃaɪ|nhút nhát
spending|ˈspendɪŋ|việc chi tiêu
strongly|ˈstrɒŋli|mạnh mẽ; kiên quyết
theirs|ðeəz|của họ
worldwide|ˌwɜːldˈwaɪd|trên toàn thế giới
written|ˈrɪtən|được viết; dạng quá khứ phân từ của write
arms|ɑːmz|cánh tay; vũ khí
abandon|əˈbændən|từ bỏ; bỏ rơi
can|kæn|có thể
may|meɪ|có thể; được phép
will|wɪl|sẽ
would|wʊd|sẽ; muốn (giả định)
do|duː|làm
have|hæv|có
be|biː|thì; là; ở
a|ə|một (mạo từ)
an|ən|một (trước âm nguyên âm)
august|ˈɔːɡəst|tháng Tám
march|mɑːtʃ|tháng Ba; diễu hành
second|ˈsekənd|thứ hai; giây
minute|ˈmɪnɪt|phút
present|ˈprezənt|hiện tại; món quà
record|ˈrekɔːd|bản ghi; hồ sơ
address|əˈdres|địa chỉ
close|kləʊz|đóng
wind|wɪnd|gió
tear|tɪə|giọt nước mắt
live|lɪv|sống
read|riːd|đọc (hiện tại)
bow|bəʊ|cái nơ; cung
lead|liːd|dẫn dắt
row|rəʊ|hàng; chèo thuyền
object|ˈɒbdʒɪkt|đồ vật; đối tượng
content|ˈkɒntent|nội dung
desert|ˈdezət|sa mạc
entrance|ˈentrəns|lối vào
produce|prəˈdjuːs|sản xuất; tạo ra
refuse|rɪˈfjuːz|từ chối
project|ˈprɒdʒekt|dự án
subject|ˈsʌbdʒɪkt|chủ đề; môn học
permit|pəˈmɪt|cho phép
process|ˈprəʊses|quá trình
polish|ˈpɒlɪʃ|đánh bóng
novel|ˈnɒvəl|tiểu thuyết
the definite|ðə|mạo từ xác định
'''.strip().splitlines():
    w, ipa, meaning = line.split('|')
    manual[w] = (ipa, meaning)

# Extra everyday items bring the merged dataset to exactly 3,000 unique entries.
supplements = '''backpack|A2|ˈbækpæk|ba lô
toothbrush|A1|ˈtuːθbrʌʃ|bàn chải đánh răng
toothpaste|A1|ˈtuːθpeɪst|kem đánh răng
shampoo|A2|ʃæmˈpuː|dầu gội
kettle|A2|ˈketəl|ấm đun nước
charger|A2|ˈtʃɑːdʒə|bộ sạc
earphone|A2|ˈɪəfəʊn|tai nghe
headphone|A2|ˈhedfəʊn|tai nghe
wifi|A2|ˈwaɪfaɪ|mạng không dây
password|A2|ˈpɑːswɜːd|mật khẩu
username|A2|ˈjuːzəneɪm|tên đăng nhập
smartphone|A2|ˈsmɑːtfəʊn|điện thoại thông minh
tablet|A2|ˈtæblət|máy tính bảng; viên thuốc
download|A2|ˌdaʊnˈləʊd|tải xuống
upload|B1|ˌʌpˈləʊd|tải lên
offline|B1|ˌɒfˈlaɪn|ngoại tuyến
online|A2|ˌɒnˈlaɪn|trực tuyến
checkout|A2|ˈtʃekaʊt|quầy thanh toán; thủ tục trả phòng
receipt|A2|rɪˈsiːt|biên lai
refund|B1|ˈriːfʌnd|khoản hoàn tiền
cashier|A2|kæˈʃɪə|nhân viên thu ngân
crosswalk|A2|ˈkrɒswɔːk|vạch sang đường
sidewalk|A2|ˈsaɪdwɔːk|vỉa hè
subway|A2|ˈsʌbweɪ|tàu điện ngầm
motorbike|A2|ˈməʊtəbaɪk|xe máy
helmet|A2|ˈhelmɪt|mũ bảo hiểm
seatbelt|A2|ˈsiːtbelt|dây an toàn
raincoat|A2|ˈreɪnkəʊt|áo mưa
slipper|A2|ˈslɪpə|dép đi trong nhà
pyjamas|A2|pəˈdʒɑːməz|đồ ngủ
laundry|A2|ˈlɔːndri|đồ giặt; việc giặt giũ
detergent|B1|dɪˈtɜːdʒənt|chất giặt tẩy
microwave|A2|ˈmaɪkrəweɪv|lò vi sóng
refrigerator|A2|rɪˈfrɪdʒəreɪtə|tủ lạnh
freezer|A2|ˈfriːzə|tủ đông
chopstick|A2|ˈtʃɒpstɪk|chiếc đũa
spicy|A2|ˈspaɪsi|cay
noodle|A2|ˈnuːdəl|sợi mì
porridge|A2|ˈpɒrɪdʒ|cháo
smoothie|A2|ˈsmuːði|sinh tố
avocado|A2|ˌævəˈkɑːdəʊ|quả bơ
broccoli|A2|ˈbrɒkəli|bông cải xanh
cauliflower|B1|ˈkɒliflaʊə|súp lơ
eggplant|A2|ˈeɡplɑːnt|cà tím
cucumber|A2|ˈkjuːkʌmbə|dưa chuột
pineapple|A2|ˈpaɪnæpəl|dứa
watermelon|A2|ˈwɔːtəmelən|dưa hấu
strawberry|A2|ˈstrɔːbəri|dâu tây
blueberry|A2|ˈbluːbəri|việt quất
raspberry|B1|ˈrɑːzbəri|quả mâm xôi
'''.strip().splitlines()

phonemes = sorted('iː ɪ ʊ uː e ə ɜː ɔː æ ʌ ɑː ɒ ɪə eɪ ʊə ɔɪ əʊ eə aɪ aʊ p b t d k ɡ f v θ ð s z ʃ ʒ h tʃ dʒ m n ŋ l r j w'.split(), key=len, reverse=True)

def normalize_ipa(ipa):
    ipa = ipa.strip('/[] ').replace('(r)', '').replace('ɡ', 'g').replace('g', 'ɡ')
    ipa = ipa.replace('ɹ', 'r').replace('ɝ', 'ɜː').replace('ɚ', 'ə').replace('ɐ', 'ə')
    ipa = ipa.replace('ʤ', 'dʒ').replace('ʧ', 'tʃ').replace('ɛ', 'e').replace('ɫ', 'l')
    ipa = ipa.replace('n̩', 'ən').replace('l̩', 'əl').replace('m̩', 'əm')
    ipa = ipa.replace('t̬', 't').replace('ɾ', 't').replace('oʊ', 'əʊ')
    ipa = re.sub(r'[\s.ˈˌːˑ]', lambda m: 'ː' if m[0]=='ː' else '', ipa)
    tokens = []
    pos = 0
    while pos < len(ipa):
        for p in phonemes:
            if ipa.startswith(p, pos):
                tokens.append(p)
                pos += len(p)
                break
        else:
            if ipa[pos] in 'iu':
                tokens.append(ipa[pos]+'ː')
                pos += 1
            else:
                raise ValueError(f'Unsupported IPA {ipa[pos:]} in {ipa}')
    return ''.join(tokens)

connection = sqlite3.connect(CACHE / 'dictionary/dictionary_en_vi.db')
# BrE corrections where the source offers only a broad/rhotic transcription.
ipa_overrides = dict(line.split('|') for line in '''bye|baɪ
different|ˈdɪfərənt
forty|ˈfɔːti
i|aɪ
ninety|ˈnaɪnti
outside|ˌaʊtˈsaɪd
pound|paʊnd
report|rɪˈpɔːt
wine|waɪn
although|ɔːlˈðəʊ
analyze|ˈænəlaɪz
forward|ˈfɔːwəd
guy|ɡaɪ
inside|ˌɪnˈsaɪd
loudly|ˈlaʊdli
onto|ˈɒntuː
organization|ˌɔːɡənaɪˈzeɪʃən
organize|ˈɔːɡənaɪz
quietly|ˈkwaɪətli
realize|ˈrɪəlaɪz
recognize|ˈrekəɡnaɪz
unfortunately|ʌnˈfɔːtʃənətli
variety|vəˈraɪəti
wow|waʊ
apologize|əˈpɒlədʒaɪz
engineering|ˌendʒɪˈnɪərɪŋ
highly|ˈhaɪli
ought|ɔːt
primary|ˈpraɪməri
reply|rɪˈplaɪ
slightly|ˈslaɪtli
summarize|ˈsʌməraɪz
county|ˈkaʊnti
criticize|ˈkrɪtɪsaɪz
emphasize|ˈemfəsaɪz
inquiry|ɪnˈkwaɪəri
lively|ˈlaɪvli
long-term|ˌlɒŋˈtɜːm
multiply|ˈmʌltɪplaɪ
origin|ˈɒrɪdʒɪn'''.splitlines())
result = []
meaning_overrides = dict(line.split('|') for line in '''essay|bài tiểu luận
want|muốn; cần
welcome|chào mừng; hoan nghênh
hello|xin chào
hi|chào bạn
bye|tạm biệt
you|bạn; các bạn
we|chúng tôi; chúng ta
they|họ; chúng
he|anh ấy
she|cô ấy
it|nó; điều đó
me|tôi (tân ngữ)
us|chúng tôi; chúng ta (tân ngữ)
them|họ; chúng (tân ngữ)
him|anh ấy (tân ngữ)
her|cô ấy; của cô ấy
our|của chúng tôi
their|của họ
coach|huấn luyện viên; xe khách
degree|mức độ; bằng cấp; độ (nhiệt độ, góc)
mean|có nghĩa là; có ý định
lay|đặt; để; đẻ trứng
lie|nằm; nói dối
weigh|cân; có trọng lượng
edit|chỉnh sửa; biên tập
component|thành phần; bộ phận
link|liên kết; mối liên hệ
fine|ổn; tốt; tiền phạt
spring|mùa xuân; lò xo
bill|hóa đơn
date|ngày tháng; cuộc hẹn
current|hiện tại; dòng chảy
patient|bệnh nhân; kiên nhẫn
issue|vấn đề; số báo; phát hành
charge|tính phí; sạc điện; khoản phí
figure|con số; hình dáng; nhân vật
capital|thủ đô; vốn; chữ hoa
couple|cặp đôi; một vài
miss|nhớ; bỏ lỡ
order|đặt hàng; thứ tự; mệnh lệnh
officer|sĩ quan; viên chức
board|tấm bảng; hội đồng; lên tàu xe
account|tài khoản; bản tường thuật
course|khóa học; quá trình
interest|sự quan tâm; sở thích; tiền lãi
draw|vẽ; kéo; trận hòa
match|trận đấu; phù hợp; que diêm
fair|công bằng; hội chợ
bear|con gấu; chịu đựng
kind|tử tế; loại
left|bên trái; đã rời đi
right|đúng; bên phải; quyền
'''.strip().splitlines())
issues = []
ordered = list(legacy) + [w for w in level_map if w not in legacy]
for word in ordered:
    level = level_map.get(word, editorial.get(word))
    if not level:
        raise ValueError(f'Level missing: {word}')
    if word == 'the definite':
        word = 'the'
    try:
        if word in legacy:
            entry = legacy[word]
            ipa, meaning = entry['ipa'], entry['meaning']
        elif word in manual:
            ipa, meaning = manual[word]
        else:
            rows = connection.execute('''SELECT p.ipa,p.region FROM words w JOIN pronunciations p ON w.id=p.word_id
              WHERE w.word=? ORDER BY CASE WHEN lower(p.region) IN ('bre','uk','received-pronunciation') THEN 0 WHEN p.region IS NULL THEN 1 ELSE 2 END,p.id''',(word,)).fetchall()
            definitions = connection.execute('''SELECT d.definition,d.pos FROM words w JOIN word_definitions wd ON w.id=wd.word_id
              JOIN definitions d ON d.id=wd.definition_id WHERE w.word=? ORDER BY wd.id''',(word,)).fetchall()
            if not rows or not definitions:
                raise ValueError('missing pronunciation or meaning')
            ipa = rows[0][0]
            mapped_pos = {'n':'N','v':'V','adj':'A','adv':'D','prep':'E'}
            expected_pos = next((mapped_pos[p] for p in pos_map.get(word,[]) if p in mapped_pos), None)
            candidates = [r for r in definitions if r[1] == expected_pos] or definitions
            meaning = next((r[0] for r in candidates if r[0].strip() and not r[0].startswith(('xem ', 'Xem '))), candidates[0][0])
            meaning = re.sub(r'\s+', ' ', meaning).strip().rstrip('.')
        if word in manual and word not in legacy:
            ipa, meaning = manual[word]
        if word in meaning_overrides and word not in legacy:
            meaning = meaning_overrides[word]
        ipa = normalize_ipa(ipa_overrides.get(word, ipa))
        result.append([word, ipa, meaning, level])
    except ValueError as error:
        issues.append([word, str(error)])

for line in supplements:
    word, level, ipa, meaning = line.split('|')
    if len(result) >= 3000:
        break
    if word not in {row[0] for row in result}:
        result.append([word, normalize_ipa(ipa), meaning, level])
if len(result) < 3000:
    print('ISSUES', json.dumps(issues, ensure_ascii=False), flush=True)
    raise ValueError(f'Only {len(result)} valid entries; add explicit corrections')
assert len(result) == len({row[0] for row in result}) == 3000
payload = (json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n').encode('utf-8')
(DATA / 'vocabulary.json').write_bytes(payload)
(DATA / 'import-report.json').write_text(json.dumps({'count':len(result),'levels':dict(Counter(r[3] for r in result)),'bytes':len(payload),'gzipBytes':len(gzip.compress(payload,mtime=0)),'excluded':issues,'editorialLevels':editorial,'manualCorrections':list(manual)},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
license_dir = ROOT / 'public' / 'licenses'
license_dir.mkdir(exist_ok=True)
shutil.copyfile(CACHE / 'cefr/LICENSE',license_dir / 'cefr-Apache-2.0.txt')
shutil.copyfile(CACHE / 'dictionary/LICENSE',license_dir / 'dictionary-CC-BY-SA-4.0.txt')
shutil.copyfile(CACHE / 'dictionary/ATTRIBUTION.md',license_dir / 'dictionary-ATTRIBUTION.md')
print(json.dumps({'count':len(result),'levels':dict(Counter(r[3] for r in result)),'bytes':len(payload),'gzipBytes':len(gzip.compress(payload,mtime=0)),'excluded':issues},ensure_ascii=False,indent=2))
