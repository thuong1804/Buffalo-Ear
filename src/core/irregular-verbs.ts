import type { Locale } from "../i18n/locale";

export interface IrregularVerb {
    base: string;
    past: string;
    participle: string;
    meaning: Record<Locale, string>;
    note?: Record<Locale, string>;
}

type VerbEntry = [string, string, string, string, string, string?, string?];

const entries: VerbEntry[] = [
    ["be", "was / were", "been", "là, ở, thì", "be; exist"],
    ["beat", "beat", "beaten", "đánh, đánh bại", "hit; defeat"],
    ["become", "became", "become", "trở thành", "become; turn into"],
    ["begin", "began", "begun", "bắt đầu", "start"],
    ["bend", "bent", "bent", "uốn cong, cúi", "bend; curve"],
    ["bet", "bet", "bet", "đánh cược", "place a bet"],
    ["bite", "bit", "bitten", "cắn", "bite"],
    ["bleed", "bled", "bled", "chảy máu", "lose blood"],
    ["blow", "blew", "blown", "thổi", "blow"],
    ["break", "broke", "broken", "làm vỡ, hỏng", "break; damage"],
    ["bring", "brought", "brought", "mang đến", "bring"],
    ["build", "built", "built", "xây dựng", "build"],
    ["burn", "burnt / burned", "burnt / burned", "cháy, đốt", "burn"],
    ["buy", "bought", "bought", "mua", "buy"],
    ["catch", "caught", "caught", "bắt, đón kịp", "catch"],
    ["choose", "chose", "chosen", "chọn", "choose; select"],
    ["come", "came", "come", "đến", "come; arrive"],
    [
        "cost",
        "cost",
        "cost",
        "có giá, tốn",
        "have a price",
        "Nghĩa định giá/ước tính chi phí dùng costed.",
        "For calculating a cost, use costed.",
    ],
    ["cut", "cut", "cut", "cắt", "cut"],
    ["deal", "dealt", "dealt", "giải quyết, chia bài", "deal with; distribute cards"],
    ["dig", "dug", "dug", "đào", "dig"],
    ["do", "did", "done", "làm", "do; perform"],
    ["draw", "drew", "drawn", "vẽ, kéo", "draw; pull"],
    ["dream", "dreamt / dreamed", "dreamt / dreamed", "mơ", "dream"],
    ["drink", "drank", "drunk", "uống", "drink"],
    ["drive", "drove", "driven", "lái xe", "drive a vehicle"],
    ["eat", "ate", "eaten", "ăn", "eat"],
    ["fall", "fell", "fallen", "rơi, ngã", "fall"],
    ["feed", "fed", "fed", "cho ăn", "give food"],
    ["feel", "felt", "felt", "cảm thấy", "feel"],
    ["fight", "fought", "fought", "chiến đấu, đánh nhau", "fight"],
    ["find", "found", "found", "tìm thấy", "find; discover"],
    ["fly", "flew", "flown", "bay", "fly"],
    ["forget", "forgot", "forgotten", "quên", "forget"],
    ["forgive", "forgave", "forgiven", "tha thứ", "forgive"],
    ["freeze", "froze", "frozen", "đóng băng", "freeze"],
    [
        "get",
        "got",
        "got / gotten",
        "nhận, có được, trở nên",
        "receive; obtain; become",
        "V3 thường là got trong Anh–Anh; gotten phổ biến trong Anh–Mỹ ở nghĩa nhận được/trở nên. Have got vẫn dùng got.",
        "V3 is usually got in British English; American English often uses gotten for obtaining/becoming. Have got keeps got.",
    ],
    ["give", "gave", "given", "cho, tặng", "give"],
    ["go", "went", "gone", "đi", "go"],
    ["grow", "grew", "grown", "lớn lên, trồng", "grow; cultivate"],
    [
        "hang",
        "hung",
        "hung",
        "treo",
        "hang; suspend",
        "Nghĩa xử tử bằng treo cổ thường dùng hanged–hanged.",
        "Execution by hanging normally uses hanged–hanged.",
    ],
    ["have", "had", "had", "có, sở hữu", "have; possess"],
    ["hear", "heard", "heard", "nghe thấy", "hear"],
    ["hide", "hid", "hidden", "giấu, trốn", "hide; conceal"],
    ["hit", "hit", "hit", "đánh, va vào", "hit; strike"],
    ["hold", "held", "held", "cầm, giữ", "hold"],
    ["hurt", "hurt", "hurt", "làm đau, bị đau", "hurt; injure"],
    ["keep", "kept", "kept", "giữ", "keep; retain"],
    ["know", "knew", "known", "biết", "know"],
    [
        "lay",
        "laid",
        "laid",
        "đặt, để xuống",
        "put something down",
        "Có tân ngữ: lay the book on the table. Không nhầm với lie (nằm).",
        "Takes an object: lay the book on the table. Different from lie (recline).",
    ],
    ["lead", "led", "led", "dẫn dắt", "lead; guide"],
    ["learn", "learnt / learned", "learnt / learned", "học", "learn"],
    ["leave", "left", "left", "rời đi, để lại", "leave; depart"],
    ["lend", "lent", "lent", "cho mượn", "lend"],
    ["let", "let", "let", "cho phép, để cho", "allow; let"],
    [
        "lie",
        "lay",
        "lain",
        "nằm",
        "lie down; recline",
        "Nghĩa nằm: lie–lay–lain. Nghĩa nói dối: lie–lied–lied (chia đều).",
        "Recline: lie–lay–lain. Tell an untruth: lie–lied–lied (regular).",
    ],
    ["light", "lit / lighted", "lit / lighted", "thắp sáng", "light; illuminate"],
    ["lose", "lost", "lost", "mất, thua", "lose"],
    ["make", "made", "made", "làm, tạo ra", "make; create"],
    ["mean", "meant", "meant", "có nghĩa, có ý định", "mean; intend"],
    ["meet", "met", "met", "gặp", "meet"],
    ["pay", "paid", "paid", "trả tiền", "pay"],
    ["put", "put", "put", "đặt, để", "put; place"],
    [
        "read",
        "read",
        "read",
        "đọc",
        "read",
        "V1 đọc /riːd/; V2 và V3 đọc /red/, dù viết giống nhau.",
        "V1 is pronounced /riːd/; V2 and V3 are /red/, despite identical spelling.",
    ],
    ["ride", "rode", "ridden", "cưỡi, đi xe đạp", "ride"],
    ["ring", "rang", "rung", "rung chuông, gọi điện", "ring; telephone"],
    ["rise", "rose", "risen", "tăng, mọc, đứng lên", "rise; go up"],
    ["run", "ran", "run", "chạy", "run"],
    ["say", "said", "said", "nói", "say"],
    ["see", "saw", "seen", "nhìn thấy", "see"],
    ["sell", "sold", "sold", "bán", "sell"],
    ["send", "sent", "sent", "gửi", "send"],
    ["set", "set", "set", "đặt, thiết lập", "set; establish"],
    ["shake", "shook", "shaken", "lắc, rung", "shake"],
    [
        "shine",
        "shone",
        "shone",
        "chiếu sáng",
        "emit light",
        "Shined cũng được dùng, nhất là nghĩa đánh bóng: shined his shoes.",
        "Shined is also used, especially for polishing: shined his shoes.",
    ],
    ["shoot", "shot", "shot", "bắn, quay phim", "shoot; film"],
    [
        "show",
        "showed",
        "shown",
        "cho xem, chỉ ra",
        "show; demonstrate",
        "V3 shown phổ biến hơn showed.",
        "Shown is the more usual V3.",
    ],
    ["shut", "shut", "shut", "đóng", "shut; close"],
    ["sing", "sang", "sung", "hát", "sing"],
    ["sink", "sank", "sunk", "chìm", "sink"],
    ["sit", "sat", "sat", "ngồi", "sit"],
    ["sleep", "slept", "slept", "ngủ", "sleep"],
    ["smell", "smelt / smelled", "smelt / smelled", "ngửi, có mùi", "smell"],
    ["speak", "spoke", "spoken", "nói", "speak"],
    ["spell", "spelt / spelled", "spelt / spelled", "đánh vần", "spell"],
    ["spend", "spent", "spent", "tiêu tiền, dành thời gian", "spend money or time"],
    ["stand", "stood", "stood", "đứng", "stand"],
    ["steal", "stole", "stolen", "ăn trộm", "steal"],
    ["stick", "stuck", "stuck", "dính, dán", "stick; attach"],
    ["swim", "swam", "swum", "bơi", "swim"],
    ["take", "took", "taken", "lấy, mang đi", "take"],
    ["teach", "taught", "taught", "dạy", "teach"],
    ["tear", "tore", "torn", "xé", "tear; rip"],
    ["tell", "told", "told", "kể, nói với", "tell"],
    ["think", "thought", "thought", "nghĩ", "think"],
    ["throw", "threw", "thrown", "ném", "throw"],
    ["understand", "understood", "understood", "hiểu", "understand"],
    ["wake", "woke", "woken", "thức dậy, đánh thức", "wake; awaken"],
    ["wear", "wore", "worn", "mặc, đeo", "wear"],
    ["win", "won", "won", "thắng", "win"],
    ["write", "wrote", "written", "viết", "write"],
];

export const irregularVerbs: IrregularVerb[] = entries.map(
    ([base, past, participle, vi, en, noteVi, noteEn]) => ({
        base,
        past,
        participle,
        meaning: { vi, en },
        ...(noteVi && noteEn ? { note: { vi: noteVi, en: noteEn } } : {}),
    }),
);

function normalizeSearch(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/đ/g, "d")
        .trim();
}

export function searchIrregularVerbs(query: string): IrregularVerb[] {
    const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return irregularVerbs;
    return irregularVerbs.filter((verb) => {
        const searchable = normalizeSearch(
            [verb.base, verb.past, verb.participle, verb.meaning.vi, verb.meaning.en].join(" "),
        );
        return terms.every((term) => searchable.includes(term));
    });
}
