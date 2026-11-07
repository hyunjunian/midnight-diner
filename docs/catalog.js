/* 100 original diner recipes; three new dishes per level, final dish at Lv.34. */
(()=>{const catalog={
  "recipes": {
    "onigiri": {
      "name": "구운 주먹밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "nori"
      ],
      "price": 480,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 1,
      "art": 0,
      "sheet": 1,
      "english": "Grilled triangular rice ball with nori on a ceramic plate"
    },
    "tamago": {
      "name": "다시 달걀말이",
      "jp": "夜の手しごと",
      "ingredients": [
        "egg",
        "dashi"
      ],
      "price": 580,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 1,
      "art": 1,
      "sheet": 1,
      "english": "Sliced golden rolled omelette"
    },
    "tonjiru": {
      "name": "돼지고기 된장국",
      "jp": "夜の手しごと",
      "ingredients": [
        "pork",
        "miso",
        "dashi"
      ],
      "price": 780,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 1,
      "art": 2,
      "sheet": 1,
      "english": "Pork miso soup with daikon in lacquer bowl"
    },
    "ochazuke": {
      "name": "연어 오차즈케",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "salmon",
        "dashi"
      ],
      "price": 980,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 2,
      "art": 0,
      "sheet": 2,
      "english": "Salmon rice with clear tea broth"
    },
    "negi_omelette": {
      "name": "파 달걀부침",
      "jp": "夜の手しごと",
      "ingredients": [
        "egg",
        "vegetables"
      ],
      "price": 705,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 2,
      "art": 5,
      "sheet": 1,
      "english": "Round green scallion omelette cut into wedges"
    },
    "hiyayakko": {
      "name": "차가운 두부 한 접시",
      "jp": "夜の手しごと",
      "ingredients": [
        "tofu",
        "vegetables",
        "soy"
      ],
      "price": 740,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 2,
      "art": 6,
      "sheet": 1,
      "english": "Chilled tofu block with scallion and soy sauce"
    },
    "butadon": {
      "name": "달큰한 돼지고기 덮밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "pork",
        "soy"
      ],
      "price": 1180,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 3,
      "art": 0,
      "sheet": 3,
      "english": "Sliced glazed pork over rice"
    },
    "misoshiru": {
      "name": "두부 된장국",
      "jp": "夜の手しごと",
      "ingredients": [
        "tofu",
        "miso",
        "dashi"
      ],
      "price": 635,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 3,
      "art": 3,
      "sheet": 1,
      "english": "Tofu and scallion miso soup"
    },
    "cabbage_stir": {
      "name": "양배추 간장볶음",
      "jp": "夜の手しごと",
      "ingredients": [
        "vegetables",
        "soy"
      ],
      "price": 810,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 3,
      "art": 8,
      "sheet": 1,
      "english": "Glossy stir fried cabbage on an oval plate"
    },
    "salmonbowl": {
      "name": "연어 솥밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "salmon",
        "miso"
      ],
      "price": 1480,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 4,
      "art": 0,
      "sheet": 4,
      "english": "Salmon mixed rice in a lidded clay pot"
    },
    "potato_soup": {
      "name": "감자 된장국",
      "jp": "夜の手しごと",
      "ingredients": [
        "potato",
        "miso",
        "dashi"
      ],
      "price": 775,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 4,
      "art": 7,
      "sheet": 1,
      "english": "Chunky potato miso soup"
    },
    "salmon_teriyaki": {
      "name": "연어 데리야키",
      "jp": "夜の手しごと",
      "ingredients": [
        "salmon",
        "soy",
        "sugar"
      ],
      "price": 975,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 4,
      "art": 9,
      "sheet": 2,
      "english": "Lacquered teriyaki salmon steak on ceramic plate"
    },
    "midnight": {
      "name": "골목의 맡김 정식",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "salmon",
        "egg",
        "dashi"
      ],
      "price": 1980,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 5,
      "art": 0,
      "sheet": 5,
      "english": "Japanese set tray with salmon rice rolled egg and soup"
    },
    "soba": {
      "name": "따뜻한 소바",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "dashi",
        "vegetables"
      ],
      "price": 800,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 5,
      "art": 4,
      "sheet": 2,
      "english": "Buckwheat noodles in dark broth with scallions"
    },
    "udon": {
      "name": "맑은 우동",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "dashi",
        "tofu"
      ],
      "price": 835,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 5,
      "art": 5,
      "sheet": 2,
      "english": "Thick white udon in clear broth with tofu"
    },
    "shio_onigiri": {
      "name": "소금 주먹밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice"
      ],
      "price": 670,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 6,
      "art": 4,
      "sheet": 1,
      "english": "Two plain white salted rice triangles no nori"
    },
    "butter_rice": {
      "name": "버터 간장밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "butter",
        "soy"
      ],
      "price": 845,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 6,
      "art": 9,
      "sheet": 1,
      "english": "Rice bowl with melting butter and soy sauce"
    },
    "tamagokake": {
      "name": "달걀 간장밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "egg",
        "soy"
      ],
      "price": 695,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 6,
      "art": 1,
      "sheet": 2,
      "english": "Rice with fresh egg yolk and soy sauce"
    },
    "oyakodon": {
      "name": "닭고기 달걀덮밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "chicken",
        "egg"
      ],
      "price": 730,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 7,
      "art": 2,
      "sheet": 2,
      "english": "Chicken and soft egg rice bowl"
    },
    "ume_chazuke": {
      "name": "매실 채소 오차즈케",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "vegetables",
        "dashi"
      ],
      "price": 765,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 7,
      "art": 3,
      "sheet": 2,
      "english": "Rice tea broth with red pickled plum and vegetables"
    },
    "nikujaga": {
      "name": "고기 감자조림",
      "jp": "夜の手しごと",
      "ingredients": [
        "pork",
        "potato",
        "soy"
      ],
      "price": 870,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 7,
      "art": 6,
      "sheet": 2,
      "english": "Braised pork potato and carrot in a shallow bowl"
    },
    "kinoko_rice": {
      "name": "버섯 솥밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "mushroom",
        "dashi"
      ],
      "price": 905,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 8,
      "art": 7,
      "sheet": 2,
      "english": "Steamed mushroom rice in an earthenware pot"
    },
    "dashi_tofu": {
      "name": "따뜻한 다시두부",
      "jp": "夜の手しごと",
      "ingredients": [
        "tofu",
        "dashi",
        "soy"
      ],
      "price": 940,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 8,
      "art": 8,
      "sheet": 2,
      "english": "Tofu cubes in golden dashi broth"
    },
    "karaage": {
      "name": "닭 가라아게",
      "jp": "夜の手しごと",
      "ingredients": [
        "chicken",
        "flour",
        "soy"
      ],
      "price": 825,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 8,
      "art": 1,
      "sheet": 3,
      "english": "Crisp golden Japanese fried chicken with lemon"
    },
    "tonkatsu": {
      "name": "바삭한 돈가스",
      "jp": "夜の手しごと",
      "ingredients": [
        "pork",
        "flour",
        "egg"
      ],
      "price": 860,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 9,
      "art": 2,
      "sheet": 3,
      "english": "Breaded pork cutlet sliced with shredded cabbage"
    },
    "ebi_fry": {
      "name": "새우튀김 한 접시",
      "jp": "夜の手しごと",
      "ingredients": [
        "shrimp",
        "flour",
        "egg"
      ],
      "price": 895,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 9,
      "art": 3,
      "sheet": 3,
      "english": "Panko fried shrimp with tails and tartar sauce"
    },
    "yakisoba": {
      "name": "골목 볶음소바",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "vegetables",
        "pork"
      ],
      "price": 930,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 9,
      "art": 4,
      "sheet": 3,
      "english": "Brown fried noodles with pork and cabbage"
    },
    "gyudon": {
      "name": "소고기 덮밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "beef",
        "rice",
        "soy"
      ],
      "price": 965,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 10,
      "art": 5,
      "sheet": 3,
      "english": "Thin simmered beef over rice with onion"
    },
    "friedrice": {
      "name": "달걀 채소볶음밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "egg",
        "vegetables"
      ],
      "price": 1000,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 10,
      "art": 6,
      "sheet": 3,
      "english": "Golden egg vegetable fried rice in a dome"
    },
    "gyoza": {
      "name": "바삭한 군만두",
      "jp": "夜の手しごと",
      "ingredients": [
        "pork",
        "flour",
        "vegetables"
      ],
      "price": 1035,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 10,
      "art": 7,
      "sheet": 3,
      "english": "Six browned crescent pork dumplings"
    },
    "tempura": {
      "name": "채소 모둠튀김",
      "jp": "夜の手しごと",
      "ingredients": [
        "vegetables",
        "flour",
        "egg"
      ],
      "price": 1070,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 11,
      "art": 8,
      "sheet": 3,
      "english": "Assorted battered vegetable tempura"
    },
    "grilled_fish": {
      "name": "고등어 소금구이",
      "jp": "夜の手しごと",
      "ingredients": [
        "fish",
        "soy"
      ],
      "price": 1105,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 11,
      "art": 9,
      "sheet": 3,
      "english": "Grilled mackerel fillet with grated radish"
    },
    "chicken_katsu": {
      "name": "치킨가스",
      "jp": "夜の手しごと",
      "ingredients": [
        "chicken",
        "flour",
        "egg"
      ],
      "price": 955,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 11,
      "art": 1,
      "sheet": 4,
      "english": "Golden chicken cutlet sliced on an oval plate"
    },
    "curry": {
      "name": "골목 카레라이스",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "potato",
        "beef"
      ],
      "price": 990,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 12,
      "art": 2,
      "sheet": 4,
      "english": "Japanese curry with potato and beef beside rice"
    },
    "kitsune_udon": {
      "name": "유부 우동",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "tofu",
        "dashi"
      ],
      "price": 1025,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 12,
      "art": 3,
      "sheet": 4,
      "english": "Udon topped with large sweet fried tofu pouch"
    },
    "tantan": {
      "name": "고기 탄탄면",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "pork",
        "soy"
      ],
      "price": 1060,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 12,
      "art": 4,
      "sheet": 4,
      "english": "Creamy spicy minced pork noodle soup"
    },
    "yakiudon": {
      "name": "채소 볶음우동",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "vegetables",
        "soy"
      ],
      "price": 1095,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 13,
      "art": 5,
      "sheet": 4,
      "english": "Thick stir fried udon with green vegetables"
    },
    "okonomiyaki": {
      "name": "작은 오코노미야키",
      "jp": "夜の手しごと",
      "ingredients": [
        "flour",
        "vegetables",
        "egg"
      ],
      "price": 1130,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 13,
      "art": 6,
      "sheet": 4,
      "english": "Cabbage pancake with sauce and bonito flakes"
    },
    "mapotofu": {
      "name": "일본식 마파두부",
      "jp": "夜の手しごと",
      "ingredients": [
        "tofu",
        "pork",
        "soy"
      ],
      "price": 1165,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 13,
      "art": 7,
      "sheet": 4,
      "english": "Tofu and minced pork in red brown sauce"
    },
    "shrimp_chahan": {
      "name": "새우볶음밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "shrimp",
        "egg"
      ],
      "price": 1200,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 14,
      "art": 8,
      "sheet": 4,
      "english": "Fried rice with whole pink shrimp and egg"
    },
    "niku_udon": {
      "name": "소고기 우동",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "beef",
        "dashi"
      ],
      "price": 1235,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 14,
      "art": 9,
      "sheet": 4,
      "english": "Hot udon with thin beef slices in broth"
    },
    "salmon_sashimi": {
      "name": "연어 사시미",
      "jp": "夜の手しごと",
      "ingredients": [
        "salmon",
        "soy"
      ],
      "price": 1085,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 14,
      "art": 1,
      "sheet": 5,
      "english": "Fan of fresh orange salmon sashimi"
    },
    "tuna_don": {
      "name": "참치 덮밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "tuna",
        "rice",
        "soy"
      ],
      "price": 1120,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 15,
      "art": 2,
      "sheet": 5,
      "english": "Raw red tuna slices on rice with nori"
    },
    "shrimp_tempura": {
      "name": "새우 덴푸라",
      "jp": "夜の手しごと",
      "ingredients": [
        "shrimp",
        "flour",
        "egg"
      ],
      "price": 1155,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 15,
      "art": 3,
      "sheet": 5,
      "english": "Light battered straight shrimp tempura"
    },
    "chicken_nabe": {
      "name": "닭고기 전골",
      "jp": "夜の手しごと",
      "ingredients": [
        "chicken",
        "vegetables",
        "dashi"
      ],
      "price": 1190,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 15,
      "art": 4,
      "sheet": 5,
      "english": "Chicken vegetables and clear broth in clay hotpot"
    },
    "sukiyaki": {
      "name": "작은 스키야키",
      "jp": "夜の手しごと",
      "ingredients": [
        "beef",
        "tofu",
        "soy"
      ],
      "price": 1225,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 16,
      "art": 5,
      "sheet": 5,
      "english": "Simmered beef tofu and scallions in iron pot"
    },
    "clam_soup": {
      "name": "조개 맑은탕",
      "jp": "夜の手しごと",
      "ingredients": [
        "clam",
        "dashi",
        "vegetables"
      ],
      "price": 1260,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 16,
      "art": 6,
      "sheet": 5,
      "english": "Open clams in clear broth with scallions"
    },
    "cheese_katsu": {
      "name": "치즈 돈가스",
      "jp": "夜の手しごと",
      "ingredients": [
        "pork",
        "cheese",
        "flour"
      ],
      "price": 1295,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 16,
      "art": 7,
      "sheet": 5,
      "english": "Cut pork cutlet with melted cheese center"
    },
    "mushroom_soba": {
      "name": "버섯 소바",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "mushroom",
        "dashi"
      ],
      "price": 1330,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 17,
      "art": 8,
      "sheet": 5,
      "english": "Soba noodle soup with many mushrooms"
    },
    "omurice": {
      "name": "폭신한 오므라이스",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "egg",
        "chicken"
      ],
      "price": 1365,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 17,
      "art": 9,
      "sheet": 5,
      "english": "Yellow soft omelette over chicken rice"
    },
    "sukiyaki_don": {
      "name": "스키야키 덮밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "beef",
        "rice",
        "soy"
      ],
      "price": 1180,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 17,
      "art": 0,
      "sheet": 6,
      "english": "Beef tofu sukiyaki over rice with egg yolk"
    },
    "seafood_udon": {
      "name": "해물 우동",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "shrimp",
        "clam"
      ],
      "price": 1215,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 18,
      "art": 1,
      "sheet": 6,
      "english": "Udon with shrimp clams and sea vegetables"
    },
    "creamy_udon": {
      "name": "크림 우동",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "milk",
        "butter"
      ],
      "price": 1250,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 18,
      "art": 2,
      "sheet": 6,
      "english": "Thick udon in creamy white butter sauce"
    },
    "chawanmushi": {
      "name": "다시 달걀찜",
      "jp": "夜の手しごと",
      "ingredients": [
        "egg",
        "dashi",
        "chicken"
      ],
      "price": 1285,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 18,
      "art": 3,
      "sheet": 6,
      "english": "Silky steamed egg custard in lidded cup"
    },
    "roast_pork": {
      "name": "수제 차슈 한 접시",
      "jp": "夜の手しごと",
      "ingredients": [
        "pork",
        "soy",
        "vegetables"
      ],
      "price": 1320,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 19,
      "art": 4,
      "sheet": 6,
      "english": "Glossy braised roast pork slices"
    },
    "salmon_cream": {
      "name": "연어 크림조림",
      "jp": "夜の手しごと",
      "ingredients": [
        "salmon",
        "milk",
        "mushroom"
      ],
      "price": 1355,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 19,
      "art": 5,
      "sheet": 6,
      "english": "Salmon and mushrooms in creamy sauce"
    },
    "stuffed_tofu": {
      "name": "고기 두부조림",
      "jp": "夜の手しごと",
      "ingredients": [
        "tofu",
        "pork",
        "vegetables"
      ],
      "price": 1390,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 19,
      "art": 6,
      "sheet": 6,
      "english": "Fried tofu stuffed with minced pork"
    },
    "potato_croquette": {
      "name": "감자 고로케",
      "jp": "夜の手しごと",
      "ingredients": [
        "potato",
        "flour",
        "egg"
      ],
      "price": 1425,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 20,
      "art": 7,
      "sheet": 6,
      "english": "Two round crisp potato croquettes split open"
    },
    "yakitori": {
      "name": "닭꼬치 모둠",
      "jp": "夜の手しごと",
      "ingredients": [
        "chicken",
        "vegetables",
        "soy"
      ],
      "price": 1460,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 20,
      "art": 8,
      "sheet": 6,
      "english": "Grilled chicken and leek skewers"
    },
    "beef_stew": {
      "name": "밤의 비프스튜",
      "jp": "夜の手しごと",
      "ingredients": [
        "beef",
        "potato",
        "dashi"
      ],
      "price": 1495,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 20,
      "art": 9,
      "sheet": 6,
      "english": "Dark beef stew with tender potato"
    },
    "chirashi": {
      "name": "흩뿌린 바다 덮밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "tuna",
        "salmon"
      ],
      "price": 1310,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 21,
      "art": 0,
      "sheet": 7,
      "english": "Chirashi rice bowl with colorful tuna and salmon"
    },
    "tendon": {
      "name": "새우 덴동",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "shrimp",
        "flour"
      ],
      "price": 1345,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 21,
      "art": 1,
      "sheet": 7,
      "english": "Tall tempura shrimp and vegetables over rice"
    },
    "katsudon": {
      "name": "달걀 가츠동",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "pork",
        "egg"
      ],
      "price": 1380,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 21,
      "art": 2,
      "sheet": 7,
      "english": "Pork cutlet simmered with egg over rice"
    },
    "beef_steak": {
      "name": "버터 소고기 스테이크",
      "jp": "夜の手しごと",
      "ingredients": [
        "beef",
        "butter",
        "soy"
      ],
      "price": 1415,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 22,
      "art": 3,
      "sheet": 7,
      "english": "Sliced beef steak with browned butter"
    },
    "scallop_butter": {
      "name": "가리비 버터구이",
      "jp": "夜の手しごと",
      "ingredients": [
        "scallops",
        "butter",
        "soy"
      ],
      "price": 1450,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 22,
      "art": 4,
      "sheet": 7,
      "english": "Golden seared scallops with butter in shells"
    },
    "oyster_fry": {
      "name": "바삭한 굴튀김",
      "jp": "夜の手しごと",
      "ingredients": [
        "oyster",
        "flour",
        "egg"
      ],
      "price": 1485,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 22,
      "art": 5,
      "sheet": 7,
      "english": "Plump breaded oysters with lemon"
    },
    "tai_chazuke": {
      "name": "도미 오차즈케",
      "jp": "夜の手しごと",
      "ingredients": [
        "fish",
        "rice",
        "dashi"
      ],
      "price": 1520,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 23,
      "art": 6,
      "sheet": 7,
      "english": "White seabream slices over rice in clear broth"
    },
    "chicken_salt_nabe": {
      "name": "닭 소금전골",
      "jp": "夜の手しごと",
      "ingredients": [
        "chicken",
        "vegetables",
        "tofu"
      ],
      "price": 1555,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 23,
      "art": 7,
      "sheet": 7,
      "english": "Chicken tofu and vegetables in pale clay pot"
    },
    "curry_udon": {
      "name": "카레 우동",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "potato",
        "beef"
      ],
      "price": 1590,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 23,
      "art": 8,
      "sheet": 7,
      "english": "Udon noodles in rich golden curry sauce"
    },
    "seafood_okonomi": {
      "name": "해물 오코노미야키",
      "jp": "夜の手しごと",
      "ingredients": [
        "flour",
        "shrimp",
        "vegetables"
      ],
      "price": 1625,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 24,
      "art": 9,
      "sheet": 7,
      "english": "Seafood pancake with shrimp and cabbage"
    },
    "premium_sushi": {
      "name": "작은 모둠초밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "tuna",
        "salmon"
      ],
      "price": 1440,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 24,
      "art": 0,
      "sheet": 8,
      "english": "Assorted tuna salmon and white fish nigiri sushi"
    },
    "scallop_chawan": {
      "name": "가리비 달걀찜",
      "jp": "夜の手しごと",
      "ingredients": [
        "egg",
        "scallops",
        "dashi"
      ],
      "price": 1475,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 24,
      "art": 1,
      "sheet": 8,
      "english": "Steamed egg custard topped with scallop"
    },
    "miso_butter_ramen": {
      "name": "된장 버터라멘",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "miso",
        "butter"
      ],
      "price": 1510,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 25,
      "art": 2,
      "sheet": 8,
      "english": "Miso ramen topped with melting butter"
    },
    "spicy_beef_ramen": {
      "name": "소고기 진한 라멘",
      "jp": "夜の手しごと",
      "ingredients": [
        "noodles",
        "beef",
        "soy"
      ],
      "price": 1545,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 25,
      "art": 3,
      "sheet": 8,
      "english": "Dark broth ramen with beef and chili"
    },
    "clam_miso": {
      "name": "조개 된장국",
      "jp": "夜の手しごと",
      "ingredients": [
        "clam",
        "miso",
        "dashi"
      ],
      "price": 1580,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 25,
      "art": 4,
      "sheet": 8,
      "english": "Miso soup filled with opened clams"
    },
    "tuna_katsu": {
      "name": "참치 레어가스",
      "jp": "夜の手しごと",
      "ingredients": [
        "tuna",
        "flour",
        "egg"
      ],
      "price": 1615,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 26,
      "art": 5,
      "sheet": 8,
      "english": "Rare red tuna cutlet with browned crumb crust"
    },
    "crab_rice": {
      "name": "게살볶음밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "crab",
        "rice",
        "egg"
      ],
      "price": 1650,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 26,
      "art": 6,
      "sheet": 8,
      "english": "Golden fried rice with white crab meat and egg"
    },
    "crab_croquette": {
      "name": "게살 크림 고로케",
      "jp": "夜の手しごと",
      "ingredients": [
        "crab",
        "milk",
        "flour"
      ],
      "price": 1685,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 26,
      "art": 7,
      "sheet": 8,
      "english": "Crisp oval croquettes with creamy crab center"
    },
    "salmon_potato": {
      "name": "연어 감자 버터구이",
      "jp": "夜の手しごと",
      "ingredients": [
        "salmon",
        "potato",
        "butter"
      ],
      "price": 1720,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 27,
      "art": 8,
      "sheet": 8,
      "english": "Roasted salmon and small golden potatoes"
    },
    "niku_tofu": {
      "name": "소고기 두부조림",
      "jp": "夜の手しごと",
      "ingredients": [
        "beef",
        "tofu",
        "soy"
      ],
      "price": 1755,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 27,
      "art": 9,
      "sheet": 8,
      "english": "Beef and tofu braised in sweet soy broth"
    },
    "seafood_nabe": {
      "name": "골목 해물전골",
      "jp": "夜の手しごと",
      "ingredients": [
        "fish",
        "shrimp",
        "clam"
      ],
      "price": 1570,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 27,
      "art": 0,
      "sheet": 9,
      "english": "Abundant fish shrimp and clams in clay hotpot"
    },
    "beef_shabu": {
      "name": "소고기 샤부샤부",
      "jp": "夜の手しごと",
      "ingredients": [
        "beef",
        "tofu",
        "vegetables"
      ],
      "price": 1605,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 28,
      "art": 1,
      "sheet": 9,
      "english": "Thin beef with tofu vegetables and steaming broth"
    },
    "prawn_gratin": {
      "name": "새우 크림그라탱",
      "jp": "夜の手しごと",
      "ingredients": [
        "shrimp",
        "cheese",
        "milk"
      ],
      "price": 1640,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 28,
      "art": 2,
      "sheet": 9,
      "english": "Baked shrimp gratin with browned cheese"
    },
    "slow_curry": {
      "name": "오래 끓인 비프카레",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "beef",
        "potato"
      ],
      "price": 1675,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 28,
      "art": 3,
      "sheet": 9,
      "english": "Rich dark slow cooked beef curry and rice"
    },
    "oyster_rice": {
      "name": "굴 솥밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "oyster",
        "rice",
        "dashi"
      ],
      "price": 1710,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 29,
      "art": 4,
      "sheet": 9,
      "english": "Plump oysters on steamed rice in clay pot"
    },
    "clam_steam": {
      "name": "조개 간장찜",
      "jp": "夜の手しごと",
      "ingredients": [
        "clam",
        "soy",
        "dashi"
      ],
      "price": 1745,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 29,
      "art": 5,
      "sheet": 9,
      "english": "Steamed open clams with fragrant soy broth"
    },
    "crab_nabe": {
      "name": "게 두부전골",
      "jp": "夜の手しごと",
      "ingredients": [
        "crab",
        "tofu",
        "vegetables"
      ],
      "price": 1780,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 29,
      "art": 6,
      "sheet": 9,
      "english": "Crab legs and tofu in small hotpot"
    },
    "mushroom_tempura": {
      "name": "버섯 모둠 덴푸라",
      "jp": "夜の手しごと",
      "ingredients": [
        "mushroom",
        "flour",
        "egg"
      ],
      "price": 1815,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 30,
      "art": 7,
      "sheet": 9,
      "english": "Crisp battered assorted mushrooms"
    },
    "seafood_chawan": {
      "name": "해물 달걀찜",
      "jp": "夜の手しごと",
      "ingredients": [
        "egg",
        "shrimp",
        "scallops"
      ],
      "price": 1850,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 30,
      "art": 8,
      "sheet": 9,
      "english": "Steamed egg with shrimp and scallops"
    },
    "tai_shio": {
      "name": "도미 소금구이",
      "jp": "夜の手しごと",
      "ingredients": [
        "fish",
        "soy",
        "vegetables"
      ],
      "price": 1885,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 30,
      "art": 9,
      "sheet": 9,
      "english": "Whole small grilled seabream with vegetables"
    },
    "chef_tasting": {
      "name": "주인장의 열 가지 기억",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "beef",
        "scallops"
      ],
      "price": 1700,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 31,
      "art": 0,
      "sheet": 10,
      "english": "Elegant multi dish tasting tray with beef scallops rice"
    },
    "sashimi_moriawase": {
      "name": "밤바다 모둠 사시미",
      "jp": "夜の手しごと",
      "ingredients": [
        "tuna",
        "salmon",
        "fish"
      ],
      "price": 1735,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 31,
      "art": 1,
      "sheet": 10,
      "english": "Beautiful platter of tuna salmon and white fish sashimi"
    },
    "nigiri_omakase": {
      "name": "오마카세 초밥 한 상",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "tuna",
        "shrimp"
      ],
      "price": 1770,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 31,
      "art": 2,
      "sheet": 10,
      "english": "Elegant ten piece nigiri sushi set"
    },
    "hotpot_omakase": {
      "name": "골목의 특별 전골",
      "jp": "夜の手しごと",
      "ingredients": [
        "beef",
        "crab",
        "tofu"
      ],
      "price": 1805,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 32,
      "art": 3,
      "sheet": 10,
      "english": "Premium hotpot with beef crab and tofu"
    },
    "crab_gratin": {
      "name": "게살 치즈그라탱",
      "jp": "夜の手しごと",
      "ingredients": [
        "crab",
        "cheese",
        "milk"
      ],
      "price": 1840,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 32,
      "art": 4,
      "sheet": 10,
      "english": "Baked crab gratin in crab shell with golden cheese"
    },
    "wagyu_don": {
      "name": "버터 스테이크 덮밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "beef",
        "rice",
        "butter"
      ],
      "price": 1875,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 32,
      "art": 5,
      "sheet": 10,
      "english": "Pink sliced steak and butter over rice"
    },
    "fish_kamameshi": {
      "name": "바다 솥밥",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "fish",
        "scallops"
      ],
      "price": 1910,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 33,
      "art": 6,
      "sheet": 10,
      "english": "Seabream scallop rice in individual iron pot"
    },
    "autumn_feast": {
      "name": "가을 숲의 한 상",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "mushroom",
        "fish"
      ],
      "price": 1945,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 33,
      "art": 7,
      "sheet": 10,
      "english": "Japanese autumn set with mushroom rice and grilled fish"
    },
    "spring_feast": {
      "name": "봄 골목의 한 상",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "shrimp",
        "vegetables"
      ],
      "price": 1980,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 33,
      "art": 8,
      "sheet": 10,
      "english": "Japanese spring set with shrimp and greens and rice"
    },
    "night_signature": {
      "name": "심야의 마지막 한 상",
      "jp": "夜の手しごと",
      "ingredients": [
        "rice",
        "crab",
        "egg",
        "salmon"
      ],
      "price": 2015,
      "method": "재료의 색과 익힘을 살피며 초록 구간에서 마무리해요.",
      "unlock": 0,
      "level": 34,
      "art": 9,
      "sheet": 10,
      "english": "Signature elegant crab salmon egg and rice set tray"
    }
  },
  "ingredients": {
    "tofu": {
      "name": "두부",
      "price": 60,
      "art": 0,
      "sheet": "pantry-a",
      "english": "Fresh tofu block"
    },
    "vegetables": {
      "name": "모둠 채소",
      "price": 70,
      "art": 1,
      "sheet": "pantry-a",
      "english": "Cabbage scallions carrot and onion"
    },
    "mushroom": {
      "name": "버섯",
      "price": 90,
      "art": 2,
      "sheet": "pantry-a",
      "english": "Fresh shiitake and shimeji mushrooms"
    },
    "noodles": {
      "name": "면",
      "price": 80,
      "art": 3,
      "sheet": "pantry-a",
      "english": "Nest of fresh udon and soba noodles"
    },
    "flour": {
      "name": "밀가루",
      "price": 40,
      "art": 4,
      "sheet": "pantry-a",
      "english": "Small rustic bowl of flour"
    },
    "shrimp": {
      "name": "새우",
      "price": 140,
      "art": 5,
      "sheet": "pantry-a",
      "english": "Fresh raw peeled shrimp"
    },
    "chicken": {
      "name": "닭고기",
      "price": 100,
      "art": 6,
      "sheet": "pantry-a",
      "english": "Raw chicken thigh on ceramic plate"
    },
    "beef": {
      "name": "소고기",
      "price": 180,
      "art": 7,
      "sheet": "pantry-a",
      "english": "Marbled beef slices"
    },
    "tuna": {
      "name": "참치",
      "price": 190,
      "art": 8,
      "sheet": "pantry-a",
      "english": "Raw red tuna loin"
    },
    "soy": {
      "name": "간장",
      "price": 35,
      "art": 9,
      "sheet": "pantry-a",
      "english": "Soy sauce in a dark ceramic pouring jug"
    },
    "butter": {
      "name": "버터",
      "price": 60,
      "art": 10,
      "sheet": "pantry-a",
      "english": "Golden butter slab on parchment"
    },
    "milk": {
      "name": "우유",
      "price": 50,
      "art": 11,
      "sheet": "pantry-a",
      "english": "Small glass bottle of milk"
    },
    "potato": {
      "name": "감자",
      "price": 45,
      "art": 12,
      "sheet": "pantry-b",
      "english": "Three fresh potatoes"
    },
    "cheese": {
      "name": "치즈",
      "price": 90,
      "art": 13,
      "sheet": "pantry-b",
      "english": "Cheese wedge and slices"
    },
    "clam": {
      "name": "바지락",
      "price": 110,
      "art": 14,
      "sheet": "pantry-b",
      "english": "Fresh clams in shells in a bowl"
    },
    "scallops": {
      "name": "가리비",
      "price": 180,
      "art": 15,
      "sheet": "pantry-b",
      "english": "Three fresh scallops in shells"
    },
    "oyster": {
      "name": "굴",
      "price": 160,
      "art": 16,
      "sheet": "pantry-b",
      "english": "Fresh shucked oysters in shells"
    },
    "crab": {
      "name": "게살",
      "price": 220,
      "art": 17,
      "sheet": "pantry-b",
      "english": "Crab legs and white crab meat"
    },
    "sugar": {
      "name": "설탕",
      "price": 25,
      "art": 18,
      "sheet": "pantry-b",
      "english": "Crystalline white sugar in a tiny crock"
    },
    "fish": {
      "name": "생선",
      "price": 150,
      "art": 19,
      "sheet": "pantry-b",
      "english": "Fresh white seabream fillet"
    }
  }
};if(typeof module!=="undefined")module.exports=catalog;else window.MidnightCatalog=catalog;})();
