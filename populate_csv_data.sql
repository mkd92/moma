-- MOMA CSV MASS IMPORT SCRIPT (SQL VERSION - FINAL FIX)
-- Pre-filled with your User ID: 041d13ef-5998-4ec5-8c16-34c25dee9098

DO $$
DECLARE
    target_uid uuid := '041d13ef-5998-4ec5-8c16-34c25dee9098';
    current_tx_id uuid;
    tag_list text[];
    t_tag_name text;
    t_tag_id uuid;
    t_acc_id uuid;
    t_cat_id uuid;
    t_prt_id uuid;
    row RECORD;
    clean_income text;
    clean_expense text;
BEGIN
    -- 1. Create Temporary Table
    CREATE TEMP TABLE temp_csv (
        tx_date text, acc_name text, party_name text, details text, 
        expense_amt text, expense_cat text, income_amt text, income_cat text, tags text
    );

    -- 2. Insert Data
    INSERT INTO temp_csv (tx_date, acc_name, party_name, details, expense_amt, expense_cat, income_amt, income_cat, tags) VALUES
    ('3/1/2026','IOB Current','VENKATESHWARAN M','UPI/642635275853/CR/M VENKATESWARA/UTI/room numb','','','2000','Guest House Rent','HOME'),
    ('3/1/2026','IOB Current','Mohan P','UPI/606067906273/CR/      Mohan  P/SBI/UPI','','','1000','Guest House Rent','HOME'),
    ('3/1/2026','IOB Current','P J RINOLD ROSARIO','UPI/536024517119/CR/P J RINOLD ROS/ICI/March 202','','','3500','Guest House Rent','HOME'),
    ('3/1/2026','IOB Current','ABINESHKUMAR','UPI/834771099582/CR/ABINESH KUMAR /HDF/Payment f','','','3300','Guest House Rent','HOME'),
    ('3/1/2026','IOB Current','','UPI/606002030982/DR/        Airtel/YES/Sent usin','300.8','Bill Payment','','','HOME'),
    ('3/1/2026','Yes Bank','','INTEREST','','','149','Interest & Divident','HOME'),
    ('3/2/2026','IOB Current','','UPI/600221170388/DR/SANTHOSH KUMAR/UBI/Sent usin','50','Dad','','','HOME'),
    ('3/2/2026','IOB Current','','UPI/201146990801/DR/  MARIAPPAN  A/KVB/Sent usin','1000','Dad','','','HOME'),
    ('3/2/2026','IOB Current','','UPI/398221257727/DR/     Kuselan S/IDF/Sent usin','750','Office Expense','','','HOME'),
    ('3/2/2026','IOB Current','JAYAKRISHNAN','UPI/606102659857/CR/Mr JEYAKRISHNA/CIU/UPI','','','2500','Guest House Rent','HOME'),
    ('3/2/2026','IOB Current','ARAVINDHAN P','UPI/606141170336/CR/  ARAVINDHAN P/ICI/rent','','','3300','Guest House Rent','HOME'),
    ('3/2/2026','IOB Current','','UPI/642750411142/CR/Mrs JAYALAKSHM/CBI/UPI','','','23000','Guest House Rent','HOME'),
    ('3/2/2026','IOB Current','','UPI/642753600144/CR/Mrs JAYALAKSHM/CBI/UPI','','','1000','Guest House Rent','HOME'),
    ('3/2/2026','IOB Current','MUKESH','UPI/642743769725/CR/Mukesh Subbram/IDF/UPI','','','3500','Guest House Rent','HOME'),
    ('3/2/2026','IOB Current','SHABEEK','UPI/642785768015/CR/MOHAMED SABEEK/UTI/Paid via','','','4000','Guest House Rent','HOME'),
    ('3/2/2026','Cash','SANJAY KROSHAN','','','','1500','Guest House Rent','HOME'),
    ('3/2/2026','Cash','NAVEEN D','','','','3500','Guest House Rent','HOME'),
    ('3/2/2026','Cash','NITHISH KUMAR M','','','','3500','Guest House Rent','HOME'),
    ('3/2/2026','IOB Current','','UPI/398206109243/DR/    XpressBees/ICI/Sent usin','125','Shopping','','','YAMINI'),
    ('3/2/2026','Axis Bank','','UPI/P2M/606128133132/J P CELLZONE         /Sent u/YES BANK LIMITED YBS','220','Shopping','','','MANI'),
    ('3/2/2026','IOB Current','','UPI/201131286582/DR/         MYJIO/HDF/Pay','349','Bill Payment','','','HOME'),
    ('3/2/2026','Axis Bank','','UPI/P2M/102830531099/APPLE MED/HDFC BANK/Executio//P2V/','149','Subscription','','','MANI'),
    ('3/3/2026','IOB Current','','ELECTRICAL MATERIAL','918','Office Expense','','','PROJECTS'),
    ('3/3/2026','IOB Current','','UPI/600297356659/DR/        ZOMATO/HDF/Sent usin','192.2','Food','','','MANI'),
    ('3/3/2026','IOB Current','SARAVANAVEL','UPI/642878378606/CR/ SARAVANAVEL R/UBI/UPI','','','3000','Guest House Rent','HOME'),
    ('3/3/2026','IOB Current','KARTHI NANJUNDESHWARAN','UPI/119426670662/CR/KARTHI NANJUND/HDF/Rent Marc','','','3000','Guest House Rent','HOME'),
    ('3/3/2026','IOB Current','RAJESH YADHAV S','UPI/642846588522/CR/RAJESH YADHAV /KKB/March','','','2000','Guest House Rent','HOME'),
    ('3/3/2026','IOB Current','KANCHI SURESH BABU','UPI/851472470573/CR/Mr Kanchi Sure/IDI/Payment f','','','3500','Guest House Rent','HOME'),
    ('3/3/2026','IOB Current','MADHAVAN','UPI/606293808339/CR/    MADHAVAN S/HDF/UPI','','','2000','Guest House Rent','HOME'),
    ('3/3/2026','IOB Current','SUDHANA SUNDAR','UPI/606247531460/CR/SUTHANASUNDAR /UCB/UPI','','','3000','Guest House Rent','HOME'),
    ('3/3/2026','IOB Current','SAKTHIVEL','UPI/642841263545/CR/     SAKTHIVEL/BKI/MARCH REN','','','2000','Guest House Rent','HOME'),
    ('3/3/2026','IOB Current','SAKTHIVEL','UPI/642893754060/CR/     SAKTHIVEL/BKI/UPI','','','500','Guest House Rent','HOME'),
    ('3/3/2026','IOB Current','','UPI/398263459602/DR/GREEN VALLEY C/HDF/Sent usin','31267','Kids','','','HOME'),
    ('3/3/2026','Cash','SENDHAMIZH SELVAN','','','','2000','Guest House Rent','HOME'),
    ('3/3/2026','Cash','SESHATHRI KARUNAMOORTHI','','','','1500','Guest House Rent','HOME'),
    ('3/3/2026','IOB Current','','UPI/201193065025/DR/ BPCL BILLDESK/HDF/Pay','868.5','Utilities','','','HOME'),
    ('3/3/2026','IOB Current','','UPI/398252537492/DR/    RAJESHWARI/YES/Tea','1630','Food','','','HOME'),
    ('3/3/2026','IOB Current','','UPI/398248877769/DR/ BP Anna nagar/YES/NA','200','Fuel','','','HOME'),
    ('3/3/2026','IOB Current','','UPI/606249622253/DR/SANTHOSH KUMAR/UBI/Water','50','Groceries','','','HOME'),
    ('3/3/2026','Axis Bank','','UPI/P2M/606220108816/Parking 7            /Sent u/YES BANK LIMITED YBS','80','Parking','','','YAMINI'),
    ('3/3/2026','IOB Current','','UPI/398257037934/DR/SURESH RAMALIN/ICI/Sent usin','700','Maintanance','','','HOME'),
    ('3/3/2026','IOB Current','','PRABHAKARAN  N STRUCTURAL DRAWING','5000','Office Expense','','','PROJECTS'),
    ('3/3/2026','IOB Current','','UPI/606287225175/    JioHotstar/YES/Collect r','2070','Subscription','','','HOME'),
    ('3/3/2026','IOB Current','','UPI/398275800207/DR/    XpressBees/ICI/Sent usin','125','Shopping','','','YAMINI'),
    ('3/3/2026','Axis Bank','','UPI/P2M/606270104202/KUSHALS RETAIL PVT LT/Sent u/HDFC BANK LTD','492','Shopping','','','YAMINI'),
    ('3/3/2026','Axis Bank','','UPI/P2M/606260118396/KUSHALS RETAIL PVT LT/Sent u/HDFC BANK LTD','642','Shopping','','','YAMINI'),
    ('3/3/2026','Axis Bank','','UPI/P2M/606270134662/KUSHALS RETAIL PVT LT/Sent u/HDFC BANK LTD','198','Shopping','','','YAMINI'),
    ('3/3/2026','Axis Bank','','UPI/P2M/109301627136/Airtelxst/ICICI Ban/Upi Mand//P2V/','279','Bill Payment','','','MANI'),
    ('3/3/2026','IOB Current','','UPI/600274864672/DR/AIADMK PARTY D/kvb/Sent usin','10000','Office Expense','','','HOME'),
    ('3/4/2026','IOB Current','','UPI/398319968082/DR/  MARIAPPAN  A/KVB/Sent usin','1000','Dad','','','HOME'),
    ('3/4/2026','IOB Current','','UPI/398311175956/DR/ SANTOSH KUMAR/IOB/Sent usin','20000','Office Expense','','','HOME'),
    ('3/4/2026','Axis Bank','','UPI/P2M/606320907781/Sami Venkatachalam Ch/Sent u/YES BANK LIMITED YBS','1000','Fuel','','','HOME'),
    ('3/4/2026','IOB Current','','UPI/398311239419/DR/    AMUTHAN MK/YES/Sent usin','20','Food','','','HOME'),
    ('3/4/2026','IOB Current','','UPI/398313880159/DR/         Zepto/YES/Sent usin','315','Groceries','','','HOME'),
    ('3/4/2026','IOB Current','','UPI/398313534954/DR/ZEPTO MARKETPL/KKB/Sent usin','158','Groceries','','','HOME'),
    ('3/4/2026','IOB Current','','UPI/201254431996/DR/  MANIKANDAN T/BKI/Remote co','110','Shopping','','','HOME'),
    ('3/4/2026','IOB Current','','UPI/398316038675/DR/SANTHOSH KUMAR/UBI/Stationar','100','Shopping','','','HOME'),
    ('3/4/2026','Axis Bank','','NEFT/IDFB606369143940/BANYAM MIKRO SUPPLY PLATFORM/IDFC FIRST BANK LTD/','','','8000','Other Income',''),
    ('3/4/2026','IOB Current','','UPI/606331023817/DR/         MYJIO/HDF/Pay','470.82','Bill Payment','','','HOME'),
    ('3/4/2026','Axis Bank','','UPI/P2M/606341363508/MOHAMMED SINAN VETTIY/Sent u/YES BANK LIMITED YBS','85','Food','','','MANI'),
    ('3/4/2026','Axis Bank','BP ANNA NAGAR','UPI/P2M/606351626801/BP Anna nagar        /NA/YES BANK LIMITED YBS','200','Fuel','','','HOME'),
    ('3/4/2026','Axis Bank','','UPI/P2M/606311753121/ANCHOR RESTAURANT    /Sent u/HDFC BANK LTD','258','Food','','','HOME'),
    ('3/5/2026','IOB Saving','','APPROVAL','91537','Office Expense','','','PROJECTS'),
    ('3/5/2026','IOB Current','SESHATHRI KARUNAMOORTHI','UPI/234234997783/CR/SeshathriKarun/SBI/RENT','','','2000','Guest House Rent','HOME'),
    ('3/5/2026','IOB Current','SUSHANT PANT','UPI/533322128055/CR/  SUSHANT PANT/ICI/Payment f','','','3500','Guest House Rent','HOME'),
    ('3/5/2026','IOB Current','ARUL NIXAN ADAIKKALARAJ','UPI/643008551442/CR/ARUL NIXAN  AD/SBI/UPI','','','3000','Guest House Rent','HOME'),
    ('3/5/2026','IOB Current','F HARITH AHMAD','NEFT-UTIB-AXNGG06475965876-GOOGLE IND-/CUST/ GOO','','','3000','Guest House Rent','HOME'),
    ('3/5/2026','IOB Current','RAJESH M','UPI/643015881466/CR/      RAJESH M/RAT/UPI','','','1000','Guest House Rent','HOME'),
    ('3/5/2026','IOB Current','RAJESH M','UPI/643025390350/CR/      RAJESH M/RAT/UPI','','','2000','Guest House Rent','HOME'),
    ('3/5/2026','IOB Current','HARI DASS V','UPI/119526800586/CR/HARIDAS  VISWA/CNR/UPI','','','1000','Guest House Rent','HOME'),
    ('3/5/2026','IOB Current','HARI DASS V','UPI/119526757615/CR/HARIDAS  VISWA/CNR/UPI','','','2000','Guest House Rent','HOME'),
    ('3/5/2026','IOB Current','MANIKANDAN','UPI/643025577220/CR/SANTHOSH KUMAR/UBI/UPI','','','2000','Guest House Rent','HOME'),
    ('3/5/2026','IOB Saving','','MARIYAPPAN  .','','','247000','Other Income','HOME'),
    ('3/5/2026','IOB Current','','UPI/398396964859/DR/  Karthi Hotel/UTI/Sent usin','20','Food','','','HOME'),
    ('3/5/2026','IOB Current','','UPI/201341953484/DR/  Karthi Hotel/UTI/Sent usin','225','Food','','','HOME'),
    ('3/5/2026','IOB Current','','UPI/398379723237/DR/         ZEPTO/KKB/Sent usin','231','Groceries','','','HOME'),
    ('3/5/2026','IOB Current','','UPI/201351840757/DR/APOLLO PHARMAC/YES/Payment f','42.84','Health','','','HOME'),
    ('3/5/2026','IOB Current','','RAJA APPROVAL','10000','Office Expense','','','PROJECTS'),
    ('3/5/2026','Axis Bank','','UPI/P2M/606412800077/RAHUMATHNISHA HAJAMOH/Sent u/INDUSIND BANK LIMITE','240','Food','','','HOME'),
    ('3/6/2026','IOB Current','VENKATAPRASATH R','UPI/606519007211/CR/Venkataprasath/SBI/UPI','','','1000','Guest House Rent','HOME'),
    ('3/6/2026','IOB Current','VENKATAPRASATH R','UPI/606596160735/CR/Venkataprasath/SBI/UPI','','','2000','Guest House Rent','HOME'),
    ('3/6/2026','IOB Current','DHAYANIDHI M','UPI/606586570409/CR/SANTHOSH KUMAR/UBI/UPI','','','1000','Guest House Rent','HOME'),
    ('3/6/2026','IOB Current','','UPI/398458582170/DR/    True Foods/YES/Payment f','112','Food','','','HOME'),
    ('3/6/2026','IOB Current','','UPI/600440113903/DR/     TRUE FOOD/YES/Sent usin','74','Food','','','HOME'),
    ('3/6/2026','IOB Current','','UPI/600439049505/DR/     TRUE FOOD/YES/Sent usin','452','Food','','','HOME'),
    ('3/6/2026','IOB Current','','DOCTOR      RIZWANA/UBI/Sent usin','930','Health','','','HOME'),
    ('3/6/2026','IOB Current','','UPI/600420638759/DR/SRMC GR FI IP /CIU/Sent usin','5000','Health','','','HOME'),
    ('3/6/2026','IOB Current','','UPI/398409833444/DR/        AIRTEL/AIR/Enter the','300','Bill Payment','','','HOME'),
    ('3/6/2026','IOB Current','','UPI/600447531740/DR/SANTHOSH KUMAR/UBI/Sent usin','500','','','',''),
    ('3/7/2026','IOB Current','MURUGAN C','UPI/643228977009/CR/       MURUGAN/UBI/UPI','','','2700','Guest House Rent','HOME'),
    ('3/7/2026','IOB Current','MURUGAN C','UPI/643263269508/CR/       MURUGAN/UBI/UPI','','','300','Guest House Rent','HOME'),
    ('3/7/2026','IOB Current','PALANI KUMAR AYYAKANNU','UPI/606614411054/CR/Palanikumar Ay/DBS/UPI','','','1000','Guest House Rent','HOME'),
    ('3/7/2026','IOB Current','PALANI KUMAR B','UPI/606624219937/CR/PALANIKUMAR  B/SBI/UPI','','','2000','Guest House Rent','HOME'),
    ('3/7/2026','IOB Current','','UPI/600518510425/DR/     TRUE FOOD/YES/Sent usin','32','Food','','','HOME'),
    ('3/7/2026','IOB Current','','UPI/600476112069/DR/     TRUE FOOD/YES/Sent usin','34','Food','','','HOME'),
    ('3/7/2026','IOB Current','','UPI/600475367843/DR/     TRUE FOOD/YES/Sent usin','62','Food','','','HOME'),
    ('3/7/2026','IOB Current','','UPI/201434191254/DR/        Airtel/YES/Sent usin','121.8','Bill Payment','','','HOME'),
    ('3/7/2026','Axis Bank','','UPI/P2M/606614939786/True Foods           /Paymen/YES BANK LIMITED YBS','28','Food','','','HOME'),
    ('3/7/2026','Axis Bank','','UPI/P2M/606634907346/TRUE FOOD            /Sent u/YES BANK LIMITED YBS','90','Food','','','HOME'),
    ('3/7/2026','Axis Bank','','UPI/P2M/606634907721/TRUE FOOD            /Sent u/YES BANK LIMITED YBS','5','Food','','','HOME'),
    ('3/7/2026','Axis Bank','','UPI/P2M/606645470123/BP Anna nagar        /NA/YES BANK LIMITED YBS','200','Fuel','','','HOME'),
    ('3/7/2026','Axis Bank','','UPI/P2M/606635450235/Mr SUDHAKAR S        /Sent u/YES BANK LIMITED YBS','36','Food','','','MANI'),
    ('3/8/2026','IOB Current','VINOTH KUMAR D','UPI/119722397341/CR/   VINOTHKUMAR/UTI/UPI','','','1500','Guest House Rent','HOME'),
    ('3/8/2026','IOB Current','FERNANDO','UPI/643359852712/CR/HEALTHWIN FERN/ICI/UPI','','','3000','Guest House Rent','HOME'),
    ('3/8/2026','IOB Current','SAM','UPI/643330052946/CR/SAM AMOS RAJAN/UBI/UPI','','','3000','Guest House Rent','HOME'),
    ('3/8/2026','IOB Current','','UPI/398573478395/DR/SRMC GR FI IP /CIU/Sent usin','30936','Health','','','HOME'),
    ('3/8/2026','IOB Current','','UPI/201519269131/DR/           JIO/KKB/Pay','29','Bill Payment','','','HOME'),
    ('3/8/2026','IOB Current','','UPI/201486901109/DR/        Airtel/YES/Sent usin','1032','Bill Payment','','','HOME'),
    ('3/8/2026','Axis Bank','','UPI/P2M/606736537792/TRUE FOOD            /Sent u/YES BANK LIMITED YBS','95','Food','','','HOME'),
    ('3/8/2026','Axis Bank','','UPI/P2M/606756570454/TRUE FOOD            /Sent u/YES BANK LIMITED YBS','39','Food','','','HOME'),
    ('3/8/2026','Axis Bank','','UPI/P2M/606715070067/BHARTI AIRTEL LIMITED/Paymen/AIRTEL PAYMENTS BANK','33','Bill Payment','','','HOME'),
    ('3/9/2026','IOB Current','','UPI/600627910133/DR/ Mr SUDHAKAR S/YES/Sent usin','25','Food','','','MANI'),
    ('3/9/2026','IOB Current','','UPI/606847829596/DR/         Ideal/UTI/Sent usin','20','Food','','','MANI'),
    ('3/9/2026','IOB Current','','UPI/398601442664/DR/AJAY KISHOR DA/IPO/Sent usin','80','Food','','','MANI'),
    ('3/9/2026','IOB Current','TAMIL','UPI/606829034190/CR/SANTHOSH KUMAR/UBI/UPI','','','3000','Guest House Rent','HOME'),
    ('3/9/2026','IOB Current','SELWAKUMAR KRISHNASWAMY','UPI/606817635345/CR/Mr SELVAKUMAR /IDI/UPI','','','1000','Guest House Rent','HOME'),
    ('3/9/2026','IOB Current','SELWAKUMAR KRISHNASWAMY','UPI/606814429627/CR/Mr SELVAKUMAR /IDI/UPI','','','2000','Guest House Rent','HOME'),
    ('3/9/2026','IOB Current','MADAN KUMAR M','UPI/643422557779/CR/  MADANKUMAR M/UBI/Paid via','','','2000','Guest House Rent','HOME'),
    ('3/9/2026','IOB Current','','THAVASUKUTTI BIRIYANI/SANTHOSH KUMAR/UBI/Sent usin','440','Food','','','HOME'),
    ('3/9/2026','IOB Current','','UPI/398600889658/DR/SANTHOSH KUMAR/UBI/Sent usin','200','Fuel','','','HOME'),
    ('3/9/2026','IOB Current','','UPI/606899321826/DR/     K MAYANDI/YES/Sent usin','96','Groceries','','','HOME'),
    ('3/9/2026','IOB Current','','UPI/600619982447/DR/SAMKIT INFOTEC/ICI/Sent usin','15656','Transfer & Return','','','OTHER'),
    ('3/9/2026','IOB Current','','UPI/600619982447/DR/SAMKIT INFOTEC/ICI/Sent usin','6000','Other Expenses','','','OTHER'),
    ('3/9/2026','IOB Current','','UPI/398628645122/DR/       KUMAR S/BKI/Sent usin','5000','Maintanance','','','HOME'),
    ('3/9/2026','IOB Current','','UPI/398590342762/DR/        1 Club/UTI/AIProTrad','211.22','Subscription','','','MANI'),
    ('3/9/2026','Axis Bank','','UPI/P2M/643403513999/The Hindu/YES BANK /OidWR202//P2V/','149','Subscription','','','MANI'),
    ('3/9/2026','Axis Bank','','UPI/P2M/606827894676/CMRL MANNADI PARKING /Sent u/YES BANK LIMITED YBS','50','Parking','','','HOME'),
    ('3/10/2026','IOB Current','','UPI/398697566509/DR/VARSHITHA TEA /YES/Sent usin','62','Food','','','MANI'),
    ('3/10/2026','IOB Current','DHAYANIDHI M','UPI/643576703706/CR/SANTHOSH KUMAR/UBI/UPI','','','2000','Guest House Rent','HOME'),
    ('3/10/2026','IOB Current','VIGNESHWARAN T','UPI/064225813584/CR/ VIGNESHWARANT/CNR/NO REMARK','','','2500','Guest House Rent','HOME'),
    ('3/10/2026','Cash','','PATHAM SALARY','9500','Office Expense','','','HOME'),
    ('3/10/2026','IOB Current','','UPI/398652466821/DR/ BP Anna nagar/YES/NA','200','Fuel','','','HOME'),
    ('3/10/2026','IOB Current','','UPI/600683723152/DR/15819 Apollo P/YES/Sent usin','215.03','Health','','','HOME'),
    ('3/10/2026','IOB Current','','UPI/606919082655/DR/  MANIKANDAN T/BKI/Sent usin','700','Lending','','','MANI'),
    ('3/10/2026','IOB Current','','UPI/606916763283/DR/ASHOK ELECTRIC/UTI/Sent usin','85','Shopping','','','HOME'),
    ('3/10/2026','IOB Current','','UPI/606949378029/DR/  J P CELLZONE/YES/Sent usin','370','Shopping','','','YAMINI'),
    ('3/10/2026','Axis Bank','','UPI/P2M/606909021641/KARTHIK S            /Sent u/YES BANK LIMITED YBS','100','Food','','','HOME'),
    ('3/10/2026','Axis Bank','MOHLDOON DASITH AKRAM','UPI/P2A/606930656699/SYEDIBRAH/FDRL/Abdul Mo/','','','3000','Guest House Rent','HOME'),
    ('3/11/2026','IOB Current','GOPINATH','UPI/772689220754/CR/   LALITHAMMAN/UBI/Payment f','','','3500','Guest House Rent','HOME'),
    ('3/11/2026','IOB Current','SYED BADULLA BASHA','UPI/160512848283/CR/SYED BADULLA B/BAR/Payment f','','','2000','Guest House Rent','HOME'),
    ('3/11/2026','Cash','','DAD','1000','Dad','','','HOME'),
    ('3/11/2026','Cash','ARUL NIXAN ADAIKKALARAJ','','','','1000','Guest House Rent','HOME'),
    ('3/11/2026','Cash','PALANI KUMAR AYYAKANNU','','','','2000','Guest House Rent','HOME'),
    ('3/11/2026','Cash','SREEJITH S','','','','2500','Guest House Rent','HOME'),
    ('3/11/2026','Cash','ASWIN ARULDHAS','','','','2500','Guest House Rent','HOME'),
    ('3/11/2026','Cash','PALANI KUMAR B','','','','1000','Guest House Rent','HOME'),
    ('3/11/2026','Cash','SURENDAR RAMESH','','','','3000','Guest House Rent','HOME'),
    ('3/11/2026','IOB Current','','Gomathi Dacument','12300','Office Expense','','','PROJECTS'),
    ('3/11/2026','IOB Current','','UPI/600722803809/DR/     K MAYANDI/YES/Sent usin','60','Groceries','','','HOME'),
    ('3/11/2026','Cash','VINOTH KUMAR D','','','','1500','Guest House Rent','HOME'),
    ('3/11/2026','Cash','SANJAY KROSHAN','','','','1500','Guest House Rent','HOME'),
    ('3/11/2026','Cash','RAJU MURUGAIYAN','','','','3050','Guest House Rent','HOME'),
    ('3/11/2026','Cash','','WASTE PAPER','','','1700','Other Income','HOME'),
    ('3/11/2026','Cash','','FOOD','150','Food','','','HOME'),
    ('3/11/2026','Cash','','FOOD','220','Food','','','HOME'),
    ('3/11/2026','Cash','','FOOD','90','Food','','','HOME'),
    ('3/11/2026','Cash','','FOOD','50','Food','','','HOME'),
    ('3/11/2026','Cash','','FOOD','140','Food','','','HOME'),
    ('3/11/2026','Cash','','FOOD','100','Food','','','HOME'),
    ('3/11/2026','Cash','','FUEL','200','Fuel','','','HOME'),
    ('3/11/2026','Cash','','MUNIS ANNA','3500','Maintanance','','','HOME'),
    ('3/11/2026','Cash','','GARBAGE REMOVAL','300','Maintanance','','','HOME'),
    ('3/11/2026','IOB Current','','UPI/201682765919/DR/     K MAYANDI/YES/Sent usin','115','Groceries','','','HOME'),
    ('3/11/2026','IOB Current','MOHAN P','','','','2000','Guest House Rent','HOME'),
    ('3/11/2026','IOB Current','MARIAPPAN A','DAD','1000','Dad','','','HOME'),
    ('3/11/2026','IOB Current','SYED BADULLA BASHA','','','','1000','Guest House Rent','HOME'),
    ('3/11/2026','IOB Current','PRADEEP KUMAR','','','','2000','Guest House Rent','HOME'),
    ('3/11/2026','IOB Current','PRADEEP KUMAR','','','','1000','Guest House Rent','HOME'),
    ('3/11/2026','IOB Current','','HI PROTEINS','85','Groceries','','','HOME'),
    ('3/11/2026','IOB Current','PRIYA MEDICALS','','832','Health','','','HOME'),
    ('3/11/2026','IOB Current','SELVAKUMAR MEDICALS','','100','Health','','','HOME'),
    ('3/11/2026','IOB Saving','','KOTTAKKAL ARYAVAIDYA SALAI','','','16000','Shop Rent','HOME'),
    ('3/11/2026','Axis Bank','','NEFT/IDFB607070825690/BANYAM MIKRO SUPPLY PLATFORM/IDFC FIRST BANK LTD/','','','15700','Transfer & Return','OTHER'),
    ('3/12/2026','IOB Current','ANZIL AHAMMAD N','','','','2000','Guest House Rent','HOME'),
    ('3/12/2026','IOB Current','MAYANDI ANNA ','','40','Groceries','','','HOME'),
    ('3/12/2026','IOB Current','ANZIL AHAMMAD N','','','','1300','Guest House Rent','HOME'),
    ('3/12/2026','IOB Current','JIO','','350.8','Bill Payment','','','HOME'),
    ('3/12/2026','IOB Current','HARIKRISHNAN SUNDARESAN','','','','2800','Guest House Rent','HOME'),
    ('3/12/2026','IOB Current','MADAN KUMAR M','','','','1000','Guest House Rent','HOME'),
    ('3/12/2026','IOB Current','AJEETH A','','','','3500','Guest House Rent','HOME'),
    ('3/12/2026','IOB Current','','PRIMAS BAKERY','70','Food','','','HOME'),
    ('3/12/2026','IOB Current','SANTHOSH KUMAR P','TANK CLEANINIG','800','Maintanance','','','HOME'),
    ('3/12/2026','IOB Current','HARIKRISHNAN SUNDARESAN','','','','200','Guest House Rent','HOME'),
    ('3/12/2026','IOB Current','IRULANDI GANESAN','','','','2000','Guest House Rent','HOME'),
    ('3/12/2026','IOB Current','IRULANDI GANESAN','','','','500','Guest House Rent','HOME'),
    ('3/12/2026','IOB Current','','PON BIRIYANI','45','Food','','','HOME'),
    ('3/12/2026','IOB Current','','RAVIN HARDARES','918','Maintanance','','','HOME'),
    ('3/12/2026','IOB Current','GANESHKUMAR','','','','3000','Guest House Rent','HOME'),
    ('3/12/2026','IOB Current','','SOMASUNDARAM C','48','Food','','','MANI'),
    ('3/12/2026','IOB Current','','ZOMATO','265.7','Food','','','MANI'),
    ('3/12/2026','Cash','SEKAR','','','','4500','Guest House Rent','HOME'),
    ('3/13/2026','IOB Current','','TAMPCOL','502','Health','','','HOME'),
    ('3/13/2026','IOB Current','','KOTTAKKAL ARYA VAIDYA SALAI','300','Health','','','HOME'),
    ('3/13/2026','IOB Current','BP ANNA NAGAR','','200','Fuel','','','HOME'),
    ('3/13/2026','IOB Current','','KALPANA ANBU SWEETS','76','Food','','','MANI'),
    ('3/13/2026','IOB Current','KATHIR','','','','2000','Guest House Rent','HOME'),
    ('3/13/2026','IOB Current','SANTHOSH KUMAR P','','12650','Office Expense','','','HOME'),
    ('3/13/2026','Cash','SREEJITH S','','','','500','Guest House Rent','HOME'),
    ('3/13/2026','Cash','ASWIN ARULDHAS','','','','500','Guest House Rent','HOME'),
    ('3/13/2026','Cash','KATHIR','','','','1000','Guest House Rent','HOME'),
    ('3/13/2026','Axis Bank','ANBURAJ MUTHUSAMY','','','','3500','Guest House Rent','HOME'),
    ('3/14/2026','IOB Current','','Thyrocare','2426','Health','','','HOME'),
    ('3/14/2026','IOB Current','ZEPTO','','961','Shopping','','','MANI'),
    ('3/14/2026','IOB Current','','Suresh Anna','1000','Office Expense','','','MANI'),
    ('3/14/2026','IOB Current','SANTHOSH KUMAR P','Tank Cleaning ','800','Maintanance','','','HOME'),
    ('3/14/2026','IOB Current','MAYANDI ANNA ','','10','Groceries','','','HOME'),
    ('3/14/2026','IOB Current','EKART','','414','Shopping','','','YAMINI'),
    ('3/14/2026','IOB Current','','DOMINOS','308.7','Food','','','MANI'),
    ('3/14/2026','IOB Current','MARIAPPAN A','','1000','Dad','','','HOME'),
    ('3/14/2026','IOB Current','','CLUB COFFEE','83','Food','','','MANI'),
    ('3/14/2026','IOB Current','','JAYAM CAFE','24','Food','','','MANI'),
    ('3/14/2026','IOB Current','','GOOGLE SUBS','199','Subscription','','','MANI'),
    ('3/14/2026','Axis Bank','','BANYAM MIKRO','','','15000','Personal Income','HOME'),
    ('3/14/2026','Axis Bank','','','606','Other Expenses','','','OTHER'),
    ('3/15/2026','IOB Current','','KINDLE UNLIMITED','169','Subscription','','','MANI'),
    ('3/15/2026','IOB Current','','COFFEE','30','Food','','','MANI'),
    ('3/15/2026','IOB Current','','HARDCASTLE RESTAURENT (MC D''S)','435.56','Food','','','MANI'),
    ('3/15/2026','IOB Current','MOHAN P','','','','1000','Guest House Rent','HOME'),
    ('3/15/2026','Axis Bank','','SP ENTERPRISES','3000','Fuel','','','HOME'),
    ('3/15/2026','Axis Bank','','YUVARAJ','','','17000','Shop Rent','HOME'),
    ('3/16/2026','IOB Current','','CLAUDE','1999','Subscription','','','HOME'),
    ('3/16/2026','IOB Current','MADAN KUMAR M','','500','Transfer & Return','','','OTHER'),
    ('3/16/2026','Cash','MADAN KUMAR M','','500','Transfer & Return','','','OTHER'),
    ('3/16/2026','IOB Saving','','SRMC','-28659','Health','','','HOME'),
    ('3/16/2026','Axis Bank','','ZERODHA','15000','Investment','','','HOME'),
    ('3/16/2026','Axis Bank','','SHADOWFAX','319','Shopping','','','YAMINI'),
    ('3/16/2026','Axis Bank','','SHADOWFAX','1010','Shopping','','','YAMINI'),
    ('3/16/2026','Axis Bank','','DELHIVERY','256.13','Shopping','','','YAMINI'),
    ('3/17/2026','IOB Current','','GOOGLE','2','Subscription','','','MANI'),
    ('3/17/2026','IOB Current','','JADA HEMAKUMAR','','','2000','Guest House Rent','HOME'),
    ('3/17/2026','IOB Current','','JADA HEMAKUMAR','','','1000','Guest House Rent','HOME'),
    ('3/17/2026','IOB Current','MAYANDI ANNA ','','60','Groceries','','','HOME'),
    ('3/17/2026','IOB Current','MARIAPPAN A','','','','1','Other Income','OTHER'),
    ('3/17/2026','IOB Current','','FUN CITY','1600','Kids','','','HOME'),
    ('3/17/2026','IOB Saving','','GOOGLE','2','Other Expenses','','','OTHER'),
    ('3/17/2026','Axis Bank','','HASITH KRISHNA ENT.','150','Shopping','','','HOME'),
    ('3/17/2026','Axis Bank','','GOPIZZA','625','Food','','','HOME'),
    ('3/17/2026','Axis Bank','','FOODBOX','110','Parking','','','HOME'),
    ('3/18/2026','IOB Current','','SAMKIT','800','Transfer & Return','','','OTHER'),
    ('3/18/2026','IOB Current','','ADAPTER','200','Maintanance','','','HOME'),
    ('3/18/2026','IOB Current','','RAJESHWARI HOT AND CHILL','','','17000','Shop Rent','HOME'),
    ('3/18/2026','IOB Current','','JAYAM CAFE','25','Food','','','MANI'),
    ('3/18/2026','IOB Current','SANTHOSH KUMAR P','TRAVEL','400','Other Expenses','','','HOME'),
    ('3/18/2026','IOB Current','MARIAPPAN A','','1000','Dad','','','HOME'),
    ('3/18/2026','Axis Bank','','COCONUT','70','Food','','','MANI'),
    ('3/18/2026','Axis Bank','','BLINKIT','353','Shopping','','','MANI'),
    ('3/19/2026','IOB Current','','SRINIVASA EYE HOSPITAL','600','Health','','','HOME'),
    ('3/19/2026','IOB Current','','SRINIVASA EYE HOSPITAL','436.5','Health','','','HOME'),
    ('3/19/2026','IOB Current','','2 WHEELER AIR','20','Fuel','','','HOME'),
    ('3/19/2026','IOB Current','','JAYAM CAFE','66','Food','','','MANI'),
    ('3/19/2026','Axis Bank','','SAMKIT','','','800','Transfer & Return','OTHER'),
    ('3/19/2026','Cash','SANTHOSH KUMAR P','DAD FOOD','589','Food','','','HOME'),
    ('3/19/2026','Cash','','EB CONNECTION','500','Office Expense','','','PROJECTS'),
    ('3/19/2026','IOB Current','','KARTHI ANNA','190','Food','','','HOME'),
    ('3/20/2026','IOB Current','','YOUTUBE','149','Subscription','','','MANI'),
    ('3/20/2026','IOB Current','','GOOGLE PLAY ','215','Subscription','','','MANI'),
    ('3/20/2026','IOB Current','','JIO ','349','Bill Payment','','','HOME'),
    ('3/20/2026','IOB Current','','TEA','50','Food','','','MANI'),
    ('3/20/2026','IOB Current','','GOOGLE','2','','','','MANI'),
    ('3/20/2026','IOB Current','','GOOGLE','-2','','','','MANI'),
    ('3/20/2026','IOB Current','','GOOGLE PLAY ','','','160.48','Other Income','MANI'),
    ('3/20/2026','IOB Current','BP ANNA NAGAR','','200','Fuel','','','HOME'),
    ('3/20/2026','IOB Current','','RAVIN HARDWARES','225','Maintanance','','','HOME'),
    ('3/20/2026','IOB Current','','PVR ','20','Parking','','','MANI'),
    ('3/20/2026','IOB Current','','PVR ','645','Entertainment','','','MANI'),
    ('3/21/2026','IOB Current','','Vegitables','261','Groceries','','','HOME'),
    ('3/21/2026','IOB Current','','Google Play ','15','Bill Payment','','','MANI'),
    ('3/21/2026','IOB Current','MARIAPPAN A','','1000','Dad','','','HOME'),
    ('3/21/2026','IOB Saving','','JAGADEESH','','','-100000','Maya Income','PROJECTS'),
    ('3/21/2026','IOB Current','','JP Cell Zone','900','Shopping','','','MANI'),
    ('3/21/2026','IOB Current','','Pon Biriyani','50','Food','','','HOME'),
    ('3/21/2026','IOB Current','','Dominos','419','Food','','','MANI'),
    ('3/21/2026','IOB Current','','Tea','20','Food','','','HOME'),
    ('3/22/2026','IOB Current','','Hiprotien','85','Groceries','','','HOME'),
    ('3/23/2026','IOB Current','','Shoe','900','Shopping','','','MANI'),
    ('3/23/2026','IOB Current','','Car','200','Maintanance','','','HOME'),
    ('3/23/2026','IOB Current','','Return ','-54500','Other Expenses','','','HOME'),
    ('3/23/2026','IOB Current','','Parts','-6000','Other Expenses','','','HOME'),
    ('3/23/2026','IOB Current','','Aladipadiyan','130','Food','','','HOME'),
    ('3/23/2026','IOB Current','','Aladipadiyan','75','Food','','','HOME'),
    ('3/24/2026','IOB Current','','Mayandi','125','Groceries','','','HOME'),
    ('3/22/2026','IOB Saving','','JAGADEESH','','','-100000','Maya Income','PROJECTS'),
    ('3/20/2026','Axis Bank','','DHASARADHAN','24','Food','','','HOME'),
    ('3/21/2026','Axis Bank','','KUMAR','160','Food','','','HOME'),
    ('3/21/2026','Axis Bank','','ARUSUVAI','20','Food','','','HOME'),
    ('3/22/2026','Axis Bank','','STAR HEALTH','54261','Other Expenses','','','HOME'),
    ('3/22/2026','Axis Bank','','CHINNASAMY','','','9000','Shop Rent','HOME'),
    ('3/23/2026','Axis Bank','','CHARGES','1711','Charges, Fees','','','HOME'),
    ('3/23/2026','Axis Bank','','BNA CHARGES','236','Charges, Fees','','','HOME'),
    ('3/23/2026','Axis Bank','','THANIGAI AGENCY','1000','Fuel','','','HOME');

    -- 3. Process each row
    FOR row IN SELECT * FROM temp_csv LOOP
        -- Clean and trim amounts
        clean_income := TRIM(row.income_amt);
        clean_expense := TRIM(row.expense_amt);

        -- a. Ensure Account exists
        IF row.acc_name <> '' THEN
            SELECT id INTO t_acc_id FROM public.accounts WHERE name = row.acc_name AND user_id = target_uid;
            IF NOT FOUND THEN
                INSERT INTO public.accounts (name, user_id, initial_balance)
                VALUES (row.acc_name, target_uid, 0)
                RETURNING id INTO t_acc_id;
            END IF;
        ELSE
            SELECT id INTO t_acc_id FROM public.accounts WHERE name = 'Cash' AND user_id = target_uid;
            IF NOT FOUND THEN
                INSERT INTO public.accounts (name, user_id, initial_balance)
                VALUES ('Cash', target_uid, 0)
                RETURNING id INTO t_acc_id;
            END IF;
        END IF;

        -- b. Ensure Party exists
        IF row.party_name <> '' THEN
            SELECT id INTO t_prt_id FROM public.parties WHERE name = row.party_name AND user_id = target_uid;
            IF NOT FOUND THEN
                INSERT INTO public.parties (name, user_id)
                VALUES (row.party_name, target_uid)
                RETURNING id INTO t_prt_id;
            END IF;
        ELSE
            t_prt_id := NULL;
        END IF;

        -- c. Handle INCOME (Only if clean_income is not empty)
        IF clean_income <> '' THEN
            SELECT id INTO t_cat_id FROM public.categories WHERE name = row.income_cat AND type = 'income' AND (user_id = target_uid OR is_system = true) LIMIT 1;
            IF NOT FOUND THEN
                INSERT INTO public.categories (name, type, icon, is_system, user_id)
                VALUES (row.income_cat, 'income', '🔖', false, target_uid)
                RETURNING id INTO t_cat_id;
            END IF;

            INSERT INTO public.transactions (user_id, transaction_date, amount, type, account_id, party_id, category_id, note)
            VALUES (target_uid, TO_DATE(row.tx_date, 'MM/DD/YYYY'), ABS(CAST(REPLACE(clean_income, ',', '') AS numeric)), 'income', t_acc_id, t_prt_id, t_cat_id, row.details)
            RETURNING id INTO current_tx_id;

        -- d. Handle EXPENSE (Only if clean_expense is not empty AND income was not found)
        ELSIF clean_expense <> '' THEN
            SELECT id INTO t_cat_id FROM public.categories WHERE name = row.expense_cat AND type = 'expense' AND (user_id = target_uid OR is_system = true) LIMIT 1;
            IF NOT FOUND THEN
                INSERT INTO public.categories (name, type, icon, is_system, user_id)
                VALUES (row.expense_cat, 'expense', '🔖', false, target_uid)
                RETURNING id INTO t_cat_id;
            END IF;

            INSERT INTO public.transactions (user_id, transaction_date, amount, type, account_id, party_id, category_id, note)
            VALUES (target_uid, TO_DATE(row.tx_date, 'MM/DD/YYYY'), ABS(CAST(REPLACE(clean_expense, ',', '') AS numeric)), 'expense', t_acc_id, t_prt_id, t_cat_id, row.details)
            RETURNING id INTO current_tx_id;
        END IF;

        -- e. Handle Tags
        IF row.tags <> '' AND current_tx_id IS NOT NULL THEN
            tag_list := string_to_array(REPLACE(row.tags, '  ', ' '), ' '); -- Handle double spaces
            FOREACH t_tag_name IN ARRAY tag_list LOOP
                t_tag_name := TRIM(t_tag_name);
                IF t_tag_name <> '' THEN
                    SELECT id INTO t_tag_id FROM public.tags WHERE lower(name) = lower(t_tag_name) AND user_id = target_uid;
                    IF NOT FOUND THEN
                        INSERT INTO public.tags (name, user_id)
                        VALUES (t_tag_name, target_uid)
                        RETURNING id INTO t_tag_id;
                    END IF;
                    
                    INSERT INTO public.transaction_tags (transaction_id, tag_id)
                    VALUES (current_tx_id, t_tag_id)
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END IF;
    END LOOP;

    -- Cleanup
    DROP TABLE temp_csv;
    RAISE NOTICE 'Mass import complete for user %', target_uid;
END $$;
