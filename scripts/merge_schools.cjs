// scripts/merge_schools.cjs
const fs = require('fs');
const path = require('path');

// 1. Read existing schoolsData.ts
const existingContent = fs.readFileSync('src/data/schoolsData.ts', 'utf8');

// Extract the INITIAL_SCHOOLS block and profiles block
const splitToken = 'export const INITIAL_PROFILES';
const parts = existingContent.split(splitToken);
if (parts.length < 2) {
  console.error('Could not split schoolsData by INITIAL_PROFILES');
  process.exit(1);
}

const headerAndSchools = parts[0];
const profilesAndRest = splitToken + parts[1];

// Parse existing schools from the TS code using a safe JS evaluation
const matchArray = headerAndSchools.match(/export const INITIAL_SCHOOLS: School\[\] = (\[[\s\S]*?\]);/);
if (!matchArray) {
  console.error('Could not match INITIAL_SCHOOLS array');
  process.exit(1);
}

// Evaluate existing schools
const existingSchools = eval(matchArray[1]);
console.log('Parsed', existingSchools.length, 'existing schools.');

// 2. Read user raw list
const userListText = fs.readFileSync('scripts/user_schools_list.txt', 'utf8');
const lines = userListText.split('\n').map(l => l.trim()).filter(Boolean);

// Clean handles
function formatHandle(rawHandle) {
  if (!rawHandle) return 'no username';
  let h = rawHandle.trim();
  if (h.toLowerCase().includes('no username') || h === '') {
    return 'no username';
  }
  // Strip any notes like "(wanja mundia)" or trailing asterisks
  h = h.replace(/\(.*\)/g, '').replace(/\*/g, '').trim();
  if (!h) return 'no username';
  if (!h.startsWith('@')) {
    h = '@' + h;
  }
  return h;
}

// Normalize name for matching
function normalizeName(name) {
  return name.toLowerCase()
    .replace(/university/g, '')
    .replace(/uni/g, '')
    .replace(/college/g, '')
    .replace(/the/g, '')
    .replace(/of/g, '')
    .replace(/at/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Map of user lines parsed
const parsedUserEntries = [];
for (const line of lines) {
  const parts = line.split('|');
  if (parts.length < 2) continue;
  const rawName = parts[0].trim();
  const rawHandle = parts[1].trim();
  const handle = formatHandle(rawHandle);
  parsedUserEntries.push({ rawName, handle });
}

console.log('Read', parsedUserEntries.length, 'entries from user list.');

// Deduplicate user list: if same rawName appears multiple times, prefer the one with an actual handle
const userSchoolsMap = new Map();
for (const item of parsedUserEntries) {
  const key = normalizeName(item.rawName);
  if (!userSchoolsMap.has(key)) {
    userSchoolsMap.set(key, item);
  } else {
    const existing = userSchoolsMap.get(key);
    if (existing.handle === 'no username' && item.handle !== 'no username') {
      userSchoolsMap.set(key, item);
    }
  }
}

console.log('Deduplicated user list has', userSchoolsMap.size, 'unique school entries.');

// Comprehensive metadata dictionary for creating new schools
const METADATA = {
  'boise state': { name: 'Boise State University', shortName: 'Boise State', location: 'Boise, Idaho', state: 'ID', mascot: 'Broncos', color: '#0033A0', est: 1932 },
  'uw madison': { name: 'University of Wisconsin-Madison', shortName: 'UW-Madison', location: 'Madison, Wisconsin', state: 'WI', mascot: 'Badgers', color: '#C5050C', est: 1848 },
  'uconn': { name: 'University of Connecticut', shortName: 'UConn', location: 'Storrs, Connecticut', state: 'CT', mascot: 'Huskies', color: '#000E2F', est: 1881 },
  'south carolina': { name: 'University of South Carolina', shortName: 'South Carolina', location: 'Columbia, South Carolina', state: 'SC', mascot: 'Gamecocks', color: '#73000A', est: 1801 },
  'umn twin cities': { name: 'University of Minnesota Twin Cities', shortName: 'UMN Twin Cities', location: 'Minneapolis, Minnesota', state: 'MN', mascot: 'Golden Gophers', color: '#7A0019', est: 1851 },
  'calpoly': { name: 'California Polytechnic State University', shortName: 'Cal Poly', location: 'San Luis Obispo, California', state: 'CA', mascot: 'Mustangs', color: '#154734', est: 1901 },
  'binghampton': { name: 'Binghamton University', shortName: 'Binghamton', location: 'Binghamton, New York', state: 'NY', mascot: 'Bearcats', color: '#005A43', est: 1946 },
  'elon': { name: 'Elon University', shortName: 'Elon', location: 'Elon, North Carolina', state: 'NC', mascot: 'Phoenix', color: '#C41230', est: 1889 },
  'uw milwaukee': { name: 'University of Wisconsin-Milwaukee', shortName: 'UW-Milwaukee', location: 'Milwaukee, Wisconsin', state: 'WI', mascot: 'Panthers', color: '#000000', est: 1956 },
  'nc state': { name: 'North Carolina State University', shortName: 'NC State', location: 'Raleigh, North Carolina', state: 'NC', mascot: 'Wolfpack', color: '#CC0000', est: 1887 },
  'tarleton state': { name: 'Tarleton State University', shortName: 'Tarleton State', location: 'Stephenville, Texas', state: 'TX', mascot: 'Texans', color: '#4F2683', est: 1899 },
  'clemson': { name: 'Clemson University', shortName: 'Clemson', location: 'Clemson, South Carolina', state: 'SC', mascot: 'Tigers', color: '#F56600', est: 1889 },
  'southern methodist': { name: 'Southern Methodist University', shortName: 'SMU', location: 'Dallas, Texas', state: 'TX', mascot: 'Mustangs', color: '#CC0000', est: 1911 },
  'penn state': { name: 'Penn State University', shortName: 'Penn State', location: 'University Park, Pennsylvania', state: 'PA', mascot: 'Nittany Lions', color: '#041E42', est: 1855 },
  'depaul': { name: 'DePaul University', shortName: 'DePaul', location: 'Chicago, Illinois', state: 'IL', mascot: 'Blue Demons', color: '#005596', est: 1898 },
  'ohio state': { name: 'Ohio State University', shortName: 'Ohio State', location: 'Columbus, Ohio', state: 'OH', mascot: 'Buckeyes', color: '#BB0000', est: 1870 },
  'georgia tech': { name: 'Georgia Institute of Technology', shortName: 'Georgia Tech', location: 'Atlanta, Georgia', state: 'GA', mascot: 'Yellow Jackets', color: '#B3A369', est: 1885 },
  'liberty': { name: 'Liberty University', shortName: 'Liberty', location: 'Lynchburg, Virginia', state: 'VA', mascot: 'Flames', color: '#002D62', est: 1971 },
  'toledo': { name: 'University of Toledo', shortName: 'Toledo', location: 'Toledo, Ohio', state: 'OH', mascot: 'Rockets', color: '#002A5C', est: 1872 },
  'james madison': { name: 'James Madison University', shortName: 'JMU', location: 'Harrisonburg, Virginia', state: 'VA', mascot: 'Dukes', color: '#450084', est: 1908 },
  'central florida': { name: 'University of Central Florida', shortName: 'UCF', location: 'Orlando, Florida', state: 'FL', mascot: 'Knights', color: '#FFC904', est: 1963 },
  'unc wilmington': { name: 'UNC Wilmington', shortName: 'UNCW', location: 'Wilmington, North Carolina', state: 'NC', mascot: 'Seahawks', color: '#007078', est: 1947 },
  'oregon state': { name: 'Oregon State University', shortName: 'Oregon State', location: 'Corvallis, Oregon', state: 'OR', mascot: 'Beavers', color: '#D73F09', est: 1868 },
  'oklahoma state': { name: 'Oklahoma State University', shortName: 'Oklahoma State', location: 'Stillwater, Oklahoma', state: 'OK', mascot: 'Cowboys', color: '#FF7300', est: 1890 },
  'george washington': { name: 'George Washington University', shortName: 'GWU', location: 'Washington, District of Columbia', state: 'DC', mascot: 'Revolutionaries', color: '#002B49', est: 1821 },
  'syracuse': { name: 'Syracuse University', shortName: 'Syracuse', location: 'Syracuse, New York', state: 'NY', mascot: 'Orange', color: '#D44500', est: 1870 },
  'auburn': { name: 'Auburn University', shortName: 'Auburn', location: 'Auburn, Alabama', state: 'AL', mascot: 'Tigers', color: '#0C2340', est: 1856 },
  'arizona state': { name: 'Arizona State University', shortName: 'ASU', location: 'Tempe, Arizona', state: 'AZ', mascot: 'Sun Devils', color: '#8C1D40', est: 1885 },
  'fordham': { name: 'Fordham University', shortName: 'Fordham', location: 'Bronx, New York', state: 'NY', mascot: 'Rams', color: '#820000', est: 1841 },
  'william & mary': { name: 'William & Mary', shortName: 'William & Mary', location: 'Williamsburg, Virginia', state: 'VA', mascot: 'Tribe', color: '#115740', est: 1693 },
  'mizzou': { name: 'University of Missouri', shortName: 'Mizzou', location: 'Columbia, Missouri', state: 'MO', mascot: 'Tigers', color: '#F1B82D', est: 1839 },
  'florida atlantic': { name: 'Florida Atlantic University', shortName: 'FAU', location: 'Boca Raton, Florida', state: 'FL', mascot: 'Owls', color: '#003366', est: 1961 },
  'south florida': { name: 'University of South Florida', shortName: 'USF', location: 'Tampa, Florida', state: 'FL', mascot: 'Bulls', color: '#006747', est: 1956 },
  'north georgia': { name: 'University of North Georgia', shortName: 'UNG', location: 'Dahlonega, Georgia', state: 'GA', mascot: 'Nighthawks', color: '#002855', est: 1873 },
  'wyoming': { name: 'University of Wyoming', shortName: 'Wyoming', location: 'Laramie, Wyoming', state: 'WY', mascot: 'Cowboys', color: '#492F24', est: 1886 },
  'arizona': { name: 'University of Arizona', shortName: 'Arizona', location: 'Tucson, Arizona', state: 'AZ', mascot: 'Wildcats', color: '#CC0033', est: 1885 },
  'grand valley state': { name: 'Grand Valley State University', shortName: 'GVSU', location: 'Allendale, Michigan', state: 'MI', mascot: 'Lakers', color: '#0065A4', est: 1960 },
  'virginia tech': { name: 'Virginia Tech', shortName: 'Virginia Tech', location: 'Blacksburg, Virginia', state: 'VA', mascot: 'Hokies', color: '#630031', est: 1872 },
  'winona state': { name: 'Winona State University', shortName: 'Winona State', location: 'Winona, Minnesota', state: 'MN', mascot: 'Warriors', color: '#492F92', est: 1858 },
  'oregon': { name: 'University of Oregon', shortName: 'Oregon', location: 'Eugene, Oregon', state: 'OR', mascot: 'Ducks', color: '#154733', est: 1876 },
  'umich': { name: 'University of Michigan', shortName: 'Michigan', location: 'Ann Arbor, Michigan', state: 'MI', mascot: 'Wolverines', color: '#00274C', est: 1817 },
  'johns hopkins': { name: 'Johns Hopkins University', shortName: 'Johns Hopkins', location: 'Baltimore, Maryland', state: 'MD', mascot: 'Blue Jays', color: '#002D72', est: 1876 },
  'san jose state': { name: 'San Jose State University', shortName: 'SJSU', location: 'San Jose, California', state: 'CA', mascot: 'Spartans', color: '#0055A2', est: 1857 },
  'ut austin': { name: 'University of Texas at Austin', shortName: 'UT Austin', location: 'Austin, Texas', state: 'TX', mascot: 'Longhorns', color: '#BF5700', est: 1883 },
  'nebraska lincoln': { name: 'University of Nebraska-Lincoln', shortName: 'Nebraska', location: 'Lincoln, Nebraska', state: 'NE', mascot: 'Cornhuskers', color: '#E41C38', est: 1869 },
  'santa clara': { name: 'Santa Clara University', shortName: 'Santa Clara', location: 'Santa Clara, California', state: 'CA', mascot: 'Broncos', color: '#862633', est: 1851 },
  'cornell': { name: 'Cornell University', shortName: 'Cornell', location: 'Ithaca, New York', state: 'NY', mascot: 'Big Red', color: '#B31B1B', est: 1865 },
  'unc charlotte': { name: 'UNC Charlotte', shortName: 'Charlotte', location: 'Charlotte, North Carolina', state: 'NC', mascot: '49ers', color: '#005035', est: 1946 },
  'mnsu': { name: 'Minnesota State University, Mankato', shortName: 'MNSU Mankato', location: 'Mankato, Minnesota', state: 'MN', mascot: 'Mavericks', color: '#4F2683', est: 1868 },
  'central connecticut': { name: 'Central Connecticut State University', shortName: 'CCSU', location: 'New Britain, Connecticut', state: 'CT', mascot: 'Blue Devils', color: '#003865', est: 1849 },
  'indiana': { name: 'Indiana University Bloomington', shortName: 'Indiana', location: 'Bloomington, Indiana', state: 'IN', mascot: 'Hoosiers', color: '#990000', est: 1820 },
  'buffalo state': { name: 'Buffalo State University', shortName: 'Buffalo State', location: 'Buffalo, New York', state: 'NY', mascot: 'Bengals', color: '#FF6600', est: 1871 },
  'grand canyon': { name: 'Grand Canyon University', shortName: 'GCU', location: 'Phoenix, Arizona', state: 'AZ', mascot: 'Antelopes', color: '#522398', est: 1949 },
  'usc': { name: 'University of Southern California', shortName: 'USC', location: 'Los Angeles, California', state: 'CA', mascot: 'Trojans', color: '#990000', est: 1880 },
  'florida gulf coast': { name: 'Florida Gulf Coast University', shortName: 'FGCU', location: 'Fort Myers, Florida', state: 'FL', mascot: 'Eagles', color: '#002D62', est: 1991 },
  'tcu': { name: 'Texas Christian University', shortName: 'TCU', location: 'Fort Worth, Texas', state: 'TX', mascot: 'Horned Frogs', color: '#4D1979', est: 1873 },
  'augusta': { name: 'Augusta University', shortName: 'Augusta', location: 'Augusta, Georgia', state: 'GA', mascot: 'Jaguars', color: '#002F6C', est: 1828 },
  'queens charlotte': { name: 'Queens University of Charlotte', shortName: 'Queens Charlotte', location: 'Charlotte, North Carolina', state: 'NC', mascot: 'Royals', color: '#0C2340', est: 1857 },
  'albany': { name: 'University at Albany, SUNY', shortName: 'UAlbany', location: 'Albany, New York', state: 'NY', mascot: 'Great Danes', color: '#46166B', est: 1844 },
  'west georgia': { name: 'University of West Georgia', shortName: 'West Georgia', location: 'Carrollton, Georgia', state: 'GA', mascot: 'Wolves', color: '#002B49', est: 1906 },
  'notre dame': { name: 'University of Notre Dame', shortName: 'Notre Dame', location: 'Notre Dame, Indiana', state: 'IN', mascot: 'Fighting Irish', color: '#0C2340', est: 1842 },
  'texas state': { name: 'Texas State University', shortName: 'Texas State', location: 'San Marcos, Texas', state: 'TX', mascot: 'Bobcats', color: '#501214', est: 1899 },
  'western carolina': { name: 'Western Carolina University', shortName: 'Western Carolina', location: 'Cullowhee, North Carolina', state: 'NC', mascot: 'Catamounts', color: '#592A8A', est: 1889 },
  'upenn': { name: 'University of Pennsylvania', shortName: 'UPenn', location: 'Philadelphia, Pennsylvania', state: 'PA', mascot: 'Quakers', color: '#011F5B', est: 1740 },
  'iowa state': { name: 'Iowa State University', shortName: 'Iowa State', location: 'Ames, Iowa', state: 'IA', mascot: 'Cyclones', color: '#C8102E', est: 1858 },
  'arkansas': { name: 'University of Arkansas', shortName: 'Arkansas', location: 'Fayetteville, Arkansas', state: 'AR', mascot: 'Razorbacks', color: '#9D2235', est: 1871 },
  'kentucky': { name: 'University of Kentucky', shortName: 'Kentucky', location: 'Lexington, Kentucky', state: 'KY', mascot: 'Wildcats', color: '#0033A0', est: 1865 },
  'fairfield': { name: 'Fairfield University', shortName: 'Fairfield', location: 'Fairfield, Connecticut', state: 'CT', mascot: 'Stags', color: '#C41230', est: 1942 },
  'quinnipiac': { name: 'Quinnipiac University', shortName: 'Quinnipiac', location: 'Hamden, Connecticut', state: 'CT', mascot: 'Bobcats', color: '#0A2240', est: 1929 },
  'nova southeastern': { name: 'Nova Southeastern University', shortName: 'Nova Southeastern', location: 'Fort Lauderdale, Florida', state: 'FL', mascot: 'Sharks', color: '#003865', est: 1964 },
  'uiowa': { name: 'University of Iowa', shortName: 'Iowa', location: 'Iowa City, Iowa', state: 'IA', mascot: 'Hawkeyes', color: '#FFCD00', est: 1847 },
  'baylor': { name: 'Baylor University', shortName: 'Baylor', location: 'Waco, Texas', state: 'TX', mascot: 'Bears', color: '#154734', est: 1845 },
  'nevada reno': { name: 'University of Nevada, Reno', shortName: 'UNR', location: 'Reno, Nevada', state: 'NV', mascot: 'Wolf Pack', color: '#003366', est: 1874 },
  'montana state': { name: 'Montana State University', shortName: 'Montana State', location: 'Bozeman, Montana', state: 'MT', mascot: 'Bobcats', color: '#00205B', est: 1893 },
  'east carolina': { name: 'East Carolina University', shortName: 'ECU', location: 'Greenville, North Carolina', state: 'NC', mascot: 'Pirates', color: '#592A8A', est: 1907 },
  'north texas': { name: 'University of North Texas', shortName: 'UNT', location: 'Denton, Texas', state: 'TX', mascot: 'Mean Green', color: '#00853E', est: 1890 },
  'denver': { name: 'University of Denver', shortName: 'Denver', location: 'Denver, Colorado', state: 'CO', mascot: 'Pioneers', color: '#BA0C2F', est: 1864 },
  'montana': { name: 'University of Montana', shortName: 'Montana', location: 'Missoula, Montana', state: 'MT', mascot: 'Grizzlies', color: '#700014', est: 1893 },
  'uc irvine': { name: 'University of California, Irvine', shortName: 'UC Irvine', location: 'Irvine, California', state: 'CA', mascot: 'Anteaters', color: '#0064A4', est: 1965 },
  'colorado state': { name: 'Colorado State University', shortName: 'Colorado State', location: 'Fort Collins, Colorado', state: 'CO', mascot: 'Rams', color: '#1E4D2B', est: 1870 },
  'ferris state': { name: 'Ferris State University', shortName: 'Ferris State', location: 'Big Rapids, Michigan', state: 'MI', mascot: 'Bulldogs', color: '#BA0C2F', est: 1884 },
  'boston college': { name: 'Boston College', shortName: 'Boston College', location: 'Chestnut Hill, Massachusetts', state: 'MA', mascot: 'Eagles', color: '#8A100B', est: 1863 },
  'uc berkeley': { name: 'University of California, Berkeley', shortName: 'UC Berkeley', location: 'Berkeley, California', state: 'CA', mascot: 'Golden Bears', color: '#003262', est: 1868 },
  'drexel': { name: 'Drexel University', shortName: 'Drexel', location: 'Philadelphia, Pennsylvania', state: 'PA', mascot: 'Dragons', color: '#07294D', est: 1891 },
  'west chester': { name: 'West Chester University', shortName: 'West Chester', location: 'West Chester, Pennsylvania', state: 'PA', mascot: 'Golden Rams', color: '#4A154B', est: 1871 },
  'umd duluth': { name: 'University of Minnesota Duluth', shortName: 'UMD Duluth', location: 'Duluth, Minnesota', state: 'MN', mascot: 'Bulldogs', color: '#7A0019', est: 1947 },
  'american': { name: 'American University', shortName: 'American', location: 'Washington, District of Columbia', state: 'DC', mascot: 'Eagles', color: '#004FA3', est: 1893 },
  'sd state': { name: 'South Dakota State University', shortName: 'SD State', location: 'Brookings, South Dakota', state: 'SD', mascot: 'Jackrabbits', color: '#0033A0', est: 1881 },
  'loyola chicago': { name: 'Loyola University Chicago', shortName: 'Loyola Chicago', location: 'Chicago, Illinois', state: 'IL', mascot: 'Ramblers', color: '#92278F', est: 1870 },
  'oklahoma': { name: 'University of Oklahoma', shortName: 'Oklahoma', location: 'Norman, Oklahoma', state: 'OK', mascot: 'Sooners', color: '#841617', est: 1890 },
  'uva': { name: 'University of Virginia', shortName: 'UVA', location: 'Charlottesville, Virginia', state: 'VA', mascot: 'Cavaliers', color: '#232D4B', est: 1819 },
  'bowling green': { name: 'Bowling Green State University', shortName: 'BGSU', location: 'Bowling Green, Ohio', state: 'OH', mascot: 'Falcons', color: '#4F2C1D', est: 1910 },
  'usfca': { name: 'University of San Francisco', shortName: 'USFCA', location: 'San Francisco, California', state: 'CA', mascot: 'Dons', color: '#00543C', est: 1855 },
  'brown': { name: 'Brown University', shortName: 'Brown', location: 'Providence, Rhode Island', state: 'RI', mascot: 'Bears', color: '#4E3629', est: 1764 },
  'pitt': { name: 'University of Pittsburgh', shortName: 'Pitt', location: 'Pittsburgh, Pennsylvania', state: 'PA', mascot: 'Panthers', color: '#003594', est: 1787 },
  'stony brook': { name: 'Stony Brook University', shortName: 'Stony Brook', location: 'Stony Brook, New York', state: 'NY', mascot: 'Seawolves', color: '#990000', est: 1957 },
  'georgia southern': { name: 'Georgia Southern University', shortName: 'Georgia Southern', location: 'Statesboro, Georgia', state: 'GA', mascot: 'Eagles', color: '#011E41', est: 1906 },
  'dayton': { name: 'University of Dayton', shortName: 'Dayton', location: 'Dayton, Ohio', state: 'OH', mascot: 'Flyers', color: '#004B87', est: 1850 },
  'ole miss': { name: 'University of Mississippi', shortName: 'Ole Miss', location: 'Oxford, Mississippi', state: 'MS', mascot: 'Rebels', color: '#CE1126', est: 1848 },
  'michigan state': { name: 'Michigan State University', shortName: 'Michigan State', location: 'East Lansing, Michigan', state: 'MI', mascot: 'Spartans', color: '#18453B', est: 1855 },
  'utah': { name: 'University of Utah', shortName: 'Utah', location: 'Salt Lake City, Utah', state: 'UT', mascot: 'Utes', color: '#CC0000', est: 1850 },
  'boston': { name: 'Boston University', shortName: 'BU', location: 'Boston, Massachusetts', state: 'MA', mascot: 'Terriers', color: '#CC0000', est: 1839 },
  'arkansas state': { name: 'Arkansas State University', shortName: 'Arkansas State', location: 'Jonesboro, Arkansas', state: 'AR', mascot: 'Red Wolves', color: '#CC092F', est: 1909 },
  'uw la crosse': { name: 'University of Wisconsin-La Crosse', shortName: 'UW-La Crosse', location: 'La Crosse, Wisconsin', state: 'WI', mascot: 'Eagles', color: '#800000', est: 1909 },
  'delaware': { name: 'University of Delaware', shortName: 'Delaware', location: 'Newark, Delaware', state: 'DE', mascot: 'Fightin Blue Hens', color: '#00539F', est: 1743 },
  'south alabama': { name: 'University of South Alabama', shortName: 'South Alabama', location: 'Mobile, Alabama', state: 'AL', mascot: 'Jaguars', color: '#00205B', est: 1963 },
  'uic': { name: 'University of Illinois Chicago', shortName: 'UIC', location: 'Chicago, Illinois', state: 'IL', mascot: 'Flames', color: '#D50032', est: 1982 },
  'purdue': { name: 'Purdue University', shortName: 'Purdue', location: 'West Lafayette, Indiana', state: 'IN', mascot: 'Boilermakers', color: '#CEB888', est: 1869 },
  'uga': { name: 'University of Georgia', shortName: 'UGA', location: 'Athens, Georgia', state: 'GA', mascot: 'Bulldogs', color: '#BA0C2F', est: 1785 },
  'indiana state': { name: 'Indiana State University', shortName: 'Indiana State', location: 'Terre Haute, Indiana', state: 'IN', mascot: 'Sycamores', color: '#00437B', est: 1865 },
  'uw whitewater': { name: 'University of Wisconsin-Whitewater', shortName: 'UW-Whitewater', location: 'Whitewater, Wisconsin', state: 'WI', mascot: 'Warhawks', color: '#502D79', est: 1868 },
  'princeton': { name: 'Princeton University', shortName: 'Princeton', location: 'Princeton, New Jersey', state: 'NJ', mascot: 'Tigers', color: '#FF6000', est: 1746 },
  'northwestern': { name: 'Northwestern University', shortName: 'Northwestern', location: 'Evanston, Illinois', state: 'IL', mascot: 'Wildcats', color: '#4E2A84', est: 1851 },
  'mississippi state': { name: 'Mississippi State University', shortName: 'Mississippi State', location: 'Starkville, Mississippi', state: 'MS', mascot: 'Bulldogs', color: '#660000', est: 1878 },
  'nyu': { name: 'New York University', shortName: 'NYU', location: 'New York, New York', state: 'NY', mascot: 'Violets', color: '#57068C', est: 1831 },
  'uiuc': { name: 'University of Illinois Urbana-Champaign', shortName: 'UIUC', location: 'Urbana-Champaign, Illinois', state: 'IL', mascot: 'Fighting Illini', color: '#13294B', est: 1867 },
  'washu': { name: 'Washington University in St. Louis', shortName: 'WashU', location: 'St. Louis, Missouri', state: 'MO', mascot: 'Bears', color: '#A51417', est: 1853 },
  'northern michigan': { name: 'Northern Michigan University', shortName: 'Northern Michigan', location: 'Marquette, Michigan', state: 'MI', mascot: 'Wildcats', color: '#095339', est: 1899 },
  'washington': { name: 'University of Washington', shortName: 'UW', location: 'Seattle, Washington', state: 'WA', mascot: 'Huskies', color: '#4B2E83', est: 1861 },
  'florida': { name: 'University of Florida', shortName: 'UF', location: 'Gainesville, Florida', state: 'FL', mascot: 'Gators', color: '#FA4616', est: 1853 },
  'unc chapel hill': { name: 'University of North Carolina at Chapel Hill', shortName: 'UNC', location: 'Chapel Hill, North Carolina', state: 'NC', mascot: 'Tar Heels', color: '#7BAFD4', est: 1789 },
  'idaho state': { name: 'Idaho State University', shortName: 'Idaho State', location: 'Pocatello, Idaho', state: 'ID', mascot: 'Bengals', color: '#F47920', est: 1901 },
  'marquette': { name: 'Marquette University', shortName: 'Marquette', location: 'Milwaukee, Wisconsin', state: 'WI', mascot: 'Golden Eagles', color: '#003366', est: 1881 },
  'saginaw valley': { name: 'Saginaw Valley State University', shortName: 'SVSU', location: 'University Center, Michigan', state: 'MI', mascot: 'Cardinals', color: '#BA0C2F', est: 1963 },
  'rochester': { name: 'University of Rochester', shortName: 'Rochester', location: 'Rochester, New York', state: 'NY', mascot: 'Yellowjackets', color: '#003B71', est: 1850 },
  'ucla': { name: 'University of California, Los Angeles', shortName: 'UCLA', location: 'Los Angeles, California', state: 'CA', mascot: 'Bruins', color: '#2774AE', est: 1919 },
  'uc san diego': { name: 'University of California, San Diego', shortName: 'UC San Diego', location: 'La Jolla, California', state: 'CA', mascot: 'Tritons', color: '#182B49', est: 1960 },
  'north florida': { name: 'University of North Florida', shortName: 'UNF', location: 'Jacksonville, Florida', state: 'FL', mascot: 'Ospreys', color: '#00246B', est: 1969 },
  'bentley': { name: 'Bentley University', shortName: 'Bentley', location: 'Waltham, Massachusetts', state: 'MA', mascot: 'Falcons', color: '#002D62', est: 1917 },
  'john carroll': { name: 'John Carroll University', shortName: 'John Carroll', location: 'University Heights, Ohio', state: 'OH', mascot: 'Blue Streaks', color: '#0C2340', est: 1886 },
  'tamu': { name: 'Texas A&M University', shortName: 'Texas A&M', location: 'College Station, Texas', state: 'TX', mascot: 'Aggies', color: '#500000', est: 1876 },
  'ut knoxville': { name: 'University of Tennessee, Knoxville', shortName: 'UT Knoxville', location: 'Knoxville, Tennessee', state: 'TN', mascot: 'Volunteers', color: '#FF8200', est: 1794 },
  'uab': { name: 'University of Alabama at Birmingham', shortName: 'UAB', location: 'Birmingham, Alabama', state: 'AL', mascot: 'Blazers', color: '#1E6B52', est: 1969 },
  'maryland': { name: 'University of Maryland', shortName: 'Maryland', location: 'College Park, Maryland', state: 'MD', mascot: 'Terrapins', color: '#E03A3E', est: 1856 },
  'florida state': { name: 'Florida State University', shortName: 'FSU', location: 'Tallahassee, Florida', state: 'FL', mascot: 'Seminoles', color: '#782F40', est: 1851 },
  'emory': { name: 'Emory University', shortName: 'Emory', location: 'Atlanta, Georgia', state: 'GA', mascot: 'Eagles', color: '#002878', est: 1836 },
  'ohio': { name: 'Ohio University', shortName: 'Ohio University', location: 'Athens, Ohio', state: 'OH', mascot: 'Bobcats', color: '#00694E', est: 1804 },
  'vanderbilt': { name: 'Vanderbilt University', shortName: 'Vanderbilt', location: 'Nashville, Tennessee', state: 'TN', mascot: 'Commodores', color: '#866D4B', est: 1873 },
  'utah state': { name: 'Utah State University', shortName: 'Utah State', location: 'Logan, Utah', state: 'UT', mascot: 'Aggies', color: '#0F2439', est: 1888 },
  'alabama': { name: 'University of Alabama', shortName: 'Alabama', location: 'Tuscaloosa, Alabama', state: 'AL', mascot: 'Crimson Tide', color: '#9E1B32', est: 1831 },
  'loyola marymount': { name: 'Loyola Marymount University', shortName: 'LMU', location: 'Los Angeles, California', state: 'CA', mascot: 'Lions', color: '#862633', est: 1911 },
  'app state': { name: 'Appalachian State University', shortName: 'App State', location: 'Boone, North Carolina', state: 'NC', mascot: 'Mountaineers', color: '#222222', est: 1899 },
  'northeastern': { name: 'Northeastern University', shortName: 'Northeastern', location: 'Boston, Massachusetts', state: 'MA', mascot: 'Huskies', color: '#CC0000', est: 1898 },
  'miami ohio': { name: 'Miami University', shortName: 'Miami (OH)', location: 'Oxford, Ohio', state: 'OH', mascot: 'RedHawks', color: '#C41230', est: 1809 },
  'drake': { name: 'Drake University', shortName: 'Drake', location: 'Des Moines, Iowa', state: 'IA', mascot: 'Bulldogs', color: '#003366', est: 1881 },
  'temple': { name: 'Temple University', shortName: 'Temple', location: 'Philadelphia, Pennsylvania', state: 'PA', mascot: 'Owls', color: '#A41D36', est: 1884 },
  'new haven': { name: 'University of New Haven', shortName: 'New Haven', location: 'West Haven, Connecticut', state: 'CT', mascot: 'Chargers', color: '#002D62', est: 1920 },
  'coastal carolina': { name: 'Coastal Carolina University', shortName: 'Coastal Carolina', location: 'Conway, South Carolina', state: 'SC', mascot: 'Chanticleers', color: '#006A6F', est: 1954 },
  'high point': { name: 'High Point University', shortName: 'High Point', location: 'High Point, North Carolina', state: 'NC', mascot: 'Panthers', color: '#330072', est: 1924 },
  'creighton': { name: 'Creighton University', shortName: 'Creighton', location: 'Omaha, Nebraska', state: 'NE', mascot: 'Bluejays', color: '#00549F', est: 1878 },
  'northern arizona': { name: 'Northern Arizona University', shortName: 'NAU', location: 'Flagstaff, Arizona', state: 'AZ', mascot: 'Lumberjacks', color: '#003366', est: 1899 },
  'murray state': { name: 'Murray State University', shortName: 'Murray State', location: 'Murray, Kentucky', state: 'KY', mascot: 'Racers', color: '#002B49', est: 1922 },
  'villanova': { name: 'Villanova University', shortName: 'Villanova', location: 'Villanova, Pennsylvania', state: 'PA', mascot: 'Wildcats', color: '#00205B', est: 1842 },
  'samford': { name: 'Samford University', shortName: 'Samford', location: 'Homewood, Alabama', state: 'AL', mascot: 'Bulldogs', color: '#0C2340', est: 1841 },
  'faulkner': { name: 'Faulkner University', shortName: 'Faulkner', location: 'Montgomery, Alabama', state: 'AL', mascot: 'Eagles', color: '#002D62', est: 1942 },
  'wake forest': { name: 'Wake Forest University', shortName: 'Wake Forest', location: 'Winston-Salem, North Carolina', state: 'NC', mascot: 'Demon Deacons', color: '#9E7E38', est: 1834 },
  'nc a&t': { name: 'North Carolina A&T State University', shortName: 'NC A&T', location: 'Greensboro, North Carolina', state: 'NC', mascot: 'Aggies', color: '#004684', est: 1891 },
  'texas tech': { name: 'Texas Tech University', shortName: 'Texas Tech', location: 'Lubbock, Texas', state: 'TX', mascot: 'Red Raiders', color: '#CC0000', est: 1923 },
  'prairie view': { name: 'Prairie View A&M University', shortName: 'Prairie View A&M', location: 'Prairie View, Texas', state: 'TX', mascot: 'Panthers', color: '#4F2683', est: 1876 },
  'austin': { name: 'Austin College', shortName: 'Austin College', location: 'Sherman, Texas', state: 'TX', mascot: 'Kangaroos', color: '#862633', est: 1849 },
  'uchicago': { name: 'University of Chicago', shortName: 'UChicago', location: 'Chicago, Illinois', state: 'IL', mascot: 'Maroons', color: '#800000', est: 1890 },
  'biola': { name: 'Biola University', shortName: 'Biola', location: 'La Mirada, California', state: 'CA', mascot: 'Eagles', color: '#C41230', est: 1908 },
  'pepperdine': { name: 'Pepperdine University', shortName: 'Pepperdine', location: 'Malibu, California', state: 'CA', mascot: 'Waves', color: '#00205B', est: 1937 },
  'uc davis': { name: 'University of California, Davis', shortName: 'UC Davis', location: 'Davis, California', state: 'CA', mascot: 'Aggies', color: '#002855', est: 1905 },
  'san diego state': { name: 'San Diego State University', shortName: 'SDSU', location: 'San Diego, California', state: 'CA', mascot: 'Aztecs', color: '#A6192E', est: 1897 },
  'holy cross': { name: 'College of the Holy Cross', shortName: 'Holy Cross', location: 'Worcester, Massachusetts', state: 'MA', mascot: 'Crusaders', color: '#582C83', est: 1843 },
  'loyola maryland': { name: 'Loyola University Maryland', shortName: 'Loyola Maryland', location: 'Baltimore, Maryland', state: 'MD', mascot: 'Greyhounds', color: '#006554', est: 1852 },
  'chapman': { name: 'Chapman University', shortName: 'Chapman', location: 'Orange, California', state: 'CA', mascot: 'Panthers', color: '#A6192E', est: 1861 },
  'colorado boulder': { name: 'University of Colorado Boulder', shortName: 'CU Boulder', location: 'Boulder, Colorado', state: 'CO', mascot: 'Buffaloes', color: '#CFB87C', est: 1876 },
  'ucsb': { name: 'University of California, Santa Barbara', shortName: 'UCSB', location: 'Santa Barbara, California', state: 'CA', mascot: 'Gauchos', color: '#003660', est: 1891 },
  'san diego': { name: 'University of San Diego', shortName: 'San Diego', location: 'San Diego, California', state: 'CA', mascot: 'Toreros', color: '#002F6C', est: 1949 },
  'gonzaga': { name: 'Gonzaga University', shortName: 'Gonzaga', location: 'Spokane, Washington', state: 'WA', mascot: 'Bulldogs', color: '#041E42', est: 1887 },
  'miami fl': { name: 'University of Miami', shortName: 'Miami (FL)', location: 'Coral Gables, Florida', state: 'FL', mascot: 'Hurricanes', color: '#F47321', est: 1925 },
  'western kentucky': { name: 'Western Kentucky University', shortName: 'WKU', location: 'Bowling Green, Kentucky', state: 'KY', mascot: 'Hilltoppers', color: '#B01E24', est: 1906 },
  'jacksonville state': { name: 'Jacksonville State University', shortName: 'Jacksonville State', location: 'Jacksonville, Alabama', state: 'AL', mascot: 'Gamecocks', color: '#CC0000', est: 1883 },
  'vermont': { name: 'University of Vermont', shortName: 'UVM', location: 'Burlington, Vermont', state: 'VT', mascot: 'Catamounts', color: '#00573D', est: 1791 },
  'maine': { name: 'University of Maine', shortName: 'Maine', location: 'Orono, Maine', state: 'ME', mascot: 'Black Bears', color: '#003263', est: 1865 },
  'georgetown': { name: 'Georgetown University', shortName: 'Georgetown', location: 'Washington, District of Columbia', state: 'DC', mascot: 'Hoyas', color: '#041E42', est: 1789 },
  'tennessee': { name: 'University of Tennessee', shortName: 'Tennessee', location: 'Knoxville, Tennessee', state: 'TN', mascot: 'Volunteers', color: '#FF8200', est: 1794 },
  'seton hall': { name: 'Seton Hall University', shortName: 'Seton Hall', location: 'South Orange, New Jersey', state: 'NJ', mascot: 'Pirates', color: '#004488', est: 1856 },
  'colorado mesa': { name: 'Colorado Mesa University', shortName: 'Colorado Mesa', location: 'Grand Junction, Colorado', state: 'CO', mascot: 'Mavericks', color: '#702082', est: 1925 },
  'cofc': { name: 'College of Charleston', shortName: 'Charleston', location: 'Charleston, South Carolina', state: 'SC', mascot: 'Cougars', color: '#660000', est: 1770 },
  'columbia': { name: 'Columbia University', shortName: 'Columbia', location: 'New York, New York', state: 'NY', mascot: 'Lions', color: '#1D70B8', est: 1754 },
  'stanford': { name: 'Stanford University', shortName: 'Stanford', location: 'Stanford, California', state: 'CA', mascot: 'Cardinal', color: '#8C1515', est: 1885 },
  'tufts': { name: 'Tufts University', shortName: 'Tufts', location: 'Medford, Massachusetts', state: 'MA', mascot: 'Jumbos', color: '#3E8EDE', est: 1852 },
  'hawaii': { name: 'University of Hawaii at Manoa', shortName: 'Hawaii', location: 'Honolulu, Hawaii', state: 'HI', mascot: 'Rainbow Warriors', color: '#024731', est: 1907 },
  'uc riverside': { name: 'University of California, Riverside', shortName: 'UC Riverside', location: 'Riverside, California', state: 'CA', mascot: 'Highlanders', color: '#003DA5', est: 1954 },
  'uw stevens point': { name: 'University of Wisconsin-Stevens Point', shortName: 'UW-Stevens Point', location: 'Stevens Point, Wisconsin', state: 'WI', mascot: 'Pointers', color: '#4A2A7B', est: 1894 },
  'st thomas': { name: 'University of St. Thomas', shortName: 'St. Thomas', location: 'St. Paul, Minnesota', state: 'MN', mascot: 'Tommies', color: '#582C83', est: 1885 },
  'ball state': { name: 'Ball State University', shortName: 'Ball State', location: 'Muncie, Indiana', state: 'IN', mascot: 'Cardinals', color: '#BA0C2F', est: 1918 },
  'byu': { name: 'Brigham Young University', shortName: 'BYU', location: 'Provo, Utah', state: 'UT', mascot: 'Cougars', color: '#002E5D', est: 1875 },
  'tulane': { name: 'Tulane University', shortName: 'Tulane', location: 'New Orleans, Louisiana', state: 'LA', mascot: 'Green Wave', color: '#006747', est: 1834 },
  'kansas state': { name: 'Kansas State University', shortName: 'Kansas State', location: 'Manhattan, Kansas', state: 'KS', mascot: 'Wildcats', color: '#512888', est: 1863 },
  'north dakota': { name: 'University of North Dakota', shortName: 'North Dakota', location: 'Grand Forks, North Dakota', state: 'ND', mascot: 'Fighting Hawks', color: '#009A44', est: 1883 },
  'duquesne': { name: 'Duquesne University', shortName: 'Duquesne', location: 'Pittsburgh, Pennsylvania', state: 'PA', mascot: 'Dukes', color: '#BA0C2F', est: 1878 },
  'bucknell': { name: 'Bucknell University', shortName: 'Bucknell', location: 'Lewisburg, Pennsylvania', state: 'PA', mascot: 'Bison', color: '#1B365D', est: 1846 },
  'mount saint mary': { name: 'Mount Saint Mary College', shortName: 'Mount Saint Mary', location: 'Newburgh, New York', state: 'NY', mascot: 'Knights', color: '#002B49', est: 1960 },
  'duke': { name: 'Duke University', shortName: 'Duke', location: 'Durham, North Carolina', state: 'NC', mascot: 'Blue Devils', color: '#003087', est: 1838 },
  'dartmouth': { name: 'Dartmouth College', shortName: 'Dartmouth', location: 'Hanover, New Hampshire', state: 'NH', mascot: 'Big Green', color: '#00693E', est: 1769 },
  'vassar': { name: 'Vassar College', shortName: 'Vassar', location: 'Poughkeepsie, New York', state: 'NY', mascot: 'Brewers', color: '#8A1538', est: 1861 },
  'colgate': { name: 'Colgate University', shortName: 'Colgate', location: 'Hamilton, New York', state: 'NY', mascot: 'Raiders', color: '#820000', est: 1819 },
  'carnegie mellon': { name: 'Carnegie Mellon University', shortName: 'Carnegie Mellon', location: 'Pittsburgh, Pennsylvania', state: 'PA', mascot: 'Tartans', color: '#C41230', est: 1900 },
  'mcgill': { name: 'McGill University', shortName: 'McGill', location: 'Montreal, Quebec', state: 'QC', mascot: 'Redbirds', color: '#ED1B2F', est: 1821 },
  'rice': { name: 'Rice University', shortName: 'Rice', location: 'Houston, Texas', state: 'TX', mascot: 'Owls', color: '#00205B', est: 1912 },
  'richmond': { name: 'University of Richmond', shortName: 'Richmond', location: 'Richmond, Virginia', state: 'VA', mascot: 'Spiders', color: '#9E1B32', est: 1830 },
  'pace': { name: 'Pace University', shortName: 'Pace', location: 'New York, New York', state: 'NY', mascot: 'Setters', color: '#002855', est: 1906 },
  'lehigh': { name: 'Lehigh University', shortName: 'Lehigh', location: 'Bethlehem, Pennsylvania', state: 'PA', mascot: 'Mountain Hawks', color: '#653819', est: 1865 },
  'hamilton': { name: 'Hamilton College', shortName: 'Hamilton', location: 'Clinton, New York', state: 'NY', mascot: 'Continentals', color: '#002F6C', est: 1793 },
  'lafayette': { name: 'Lafayette College', shortName: 'Lafayette', location: 'Easton, Pennsylvania', state: 'PA', mascot: 'Leopards', color: '#841617', est: 1826 },
  'suny cortland': { name: 'SUNY Cortland', shortName: 'Cortland', location: 'Cortland, New York', state: 'NY', mascot: 'Red Dragons', color: '#C41230', est: 1868 },
  'suny oneonta': { name: 'SUNY Oneonta', shortName: 'Oneonta', location: 'Oneonta, New York', state: 'NY', mascot: 'Red Dragons', color: '#9D2235', est: 1889 },
  'williams': { name: 'Williams College', shortName: 'Williams', location: 'Williamstown, Massachusetts', state: 'MA', mascot: 'Ephs', color: '#582C83', est: 1793 },
  'amherst': { name: 'Amherst College', shortName: 'Amherst', location: 'Amherst, Massachusetts', state: 'MA', mascot: 'Mammoths', color: '#4A2A7B', est: 1821 },
  'sacred heart': { name: 'Sacred Heart University', shortName: 'Sacred Heart', location: 'Fairfield, Connecticut', state: 'CT', mascot: 'Pioneers', color: '#C41230', est: 1963 },
  'tampa': { name: 'University of Tampa', shortName: 'Tampa', location: 'Tampa, Florida', state: 'FL', mascot: 'Spartans', color: '#BA0C2F', est: 1931 },
  'harvard': { name: 'Harvard University', shortName: 'Harvard', location: 'Cambridge, Massachusetts', state: 'MA', mascot: 'Crimson', color: '#A51C30', est: 1636 },
  'hofstra': { name: 'Hofstra University', shortName: 'Hofstra', location: 'Hempstead, New York', state: 'NY', mascot: 'Pride', color: '#003865', est: 1935 },
  'case western': { name: 'Case Western Reserve University', shortName: 'Case Western', location: 'Cleveland, Ohio', state: 'OH', mascot: 'Spartans', color: '#0A304E', est: 1826 },
  'marist': { name: 'Marist College', shortName: 'Marist', location: 'Poughkeepsie, New York', state: 'NY', mascot: 'Red Foxes', color: '#C41230', est: 1929 },
  'uc santa cruz': { name: 'University of California, Santa Cruz', shortName: 'UC Santa Cruz', location: 'Santa Cruz, California', state: 'CA', mascot: 'Banana Slugs', color: '#003C6C', est: 1965 },
  'providence': { name: 'Providence College', shortName: 'Providence', location: 'Providence, Rhode Island', state: 'RI', mascot: 'Friars', color: '#000000', est: 1917 },
  'saint marys': { name: "Saint Mary's College of California", shortName: "Saint Mary's", location: 'Moraga, California', state: 'CA', mascot: 'Gaels', color: '#0C2340', est: 1863 },
  'northwest nazarene': { name: 'Northwest Nazarene University', shortName: 'NNU', location: 'Nampa, Idaho', state: 'ID', mascot: 'Nighthawks', color: '#C41230', est: 1913 },
  'lsu': { name: 'Louisiana State University', shortName: 'LSU', location: 'Baton Rouge, Louisiana', state: 'LA', mascot: 'Tigers', color: '#461D7C', est: 1860 },
  'colby': { name: 'Colby College', shortName: 'Colby', location: 'Waterville, Maine', state: 'ME', mascot: 'Mules', color: '#002855', est: 1813 },
  'grinnell': { name: 'Grinnell College', shortName: 'Grinnell', location: 'Grinnell, Iowa', state: 'IA', mascot: 'Pioneers', color: '#C41230', est: 1846 },
  'mit': { name: 'Massachusetts Institute of Technology', shortName: 'MIT', location: 'Cambridge, Massachusetts', state: 'MA', mascot: 'Engineers', color: '#A31F34', est: 1861 },
  'rutgers': { name: 'Rutgers University', shortName: 'Rutgers', location: 'New Brunswick, New Jersey', state: 'NJ', mascot: 'Scarlet Knights', color: '#CC0033', est: 1766 },
  'new hampshire': { name: 'University of New Hampshire', shortName: 'New Hampshire', location: 'Durham, New Hampshire', state: 'NH', mascot: 'Wildcats', color: '#003594', est: 1866 },
  'central michigan': { name: 'Central Michigan University', shortName: 'Central Michigan', location: 'Mount Pleasant, Michigan', state: 'MI', mascot: 'Chippewas', color: '#6A0032', est: 1892 },
  'eastern michigan': { name: 'Eastern Michigan University', shortName: 'Eastern Michigan', location: 'Ypsilanti, Michigan', state: 'MI', mascot: 'Eagles', color: '#006633', est: 1849 },
  'wayne state': { name: 'Wayne State University', shortName: 'Wayne State', location: 'Detroit, Michigan', state: 'MI', mascot: 'Warriors', color: '#0C5449', est: 1868 },
  'cedarville': { name: 'Cedarville University', shortName: 'Cedarville', location: 'Cedarville, Ohio', state: 'OH', mascot: 'Yellow Jackets', color: '#002B49', est: 1887 },
  'huntington': { name: 'Huntington University', shortName: 'Huntington', location: 'Huntington, Indiana', state: 'IN', mascot: 'Foresters', color: '#006341', est: 1897 },
  'bryant': { name: 'Bryant University', shortName: 'Bryant', location: 'Smithfield, Rhode Island', state: 'RI', mascot: 'Bulldogs', color: '#1B365D', est: 1863 },
  'worcester state': { name: 'Worcester State University', shortName: 'Worcester State', location: 'Worcester, Massachusetts', state: 'MA', mascot: 'Lancers', color: '#002B49', est: 1874 },
  'rhode island college': { name: 'Rhode Island College', shortName: 'Rhode Island College', location: 'Providence, Rhode Island', state: 'RI', mascot: 'Anchormen', color: '#862633', est: 1854 },
  'johnson & wales': { name: 'Johnson & Wales University', shortName: 'JWU', location: 'Providence, Rhode Island', state: 'RI', mascot: 'Wildcats', color: '#003366', est: 1914 },
  'unlv': { name: 'University of Nevada, Las Vegas', shortName: 'UNLV', location: 'Las Vegas, Nevada', state: 'NV', mascot: 'Rebels', color: '#CF102D', est: 1957 },
  'xavier': { name: 'Xavier University', shortName: 'Xavier', location: 'Cincinnati, Ohio', state: 'OH', mascot: 'Musketeers', color: '#0C2340', est: 1831 },
  'furman': { name: 'Furman University', shortName: 'Furman', location: 'Greenville, South Carolina', state: 'SC', mascot: 'Paladins', color: '#582C83', est: 1826 },
  'seton hill': { name: 'Seton Hill University', shortName: 'Seton Hill', location: 'Greensburg, Pennsylvania', state: 'PA', mascot: 'Griffins', color: '#862633', est: 1885 },
  'csu fullerton': { name: 'California State University, Fullerton', shortName: 'CSU Fullerton', location: 'Fullerton, California', state: 'CA', mascot: 'Titans', color: '#00274C', est: 1957 },
  'san francisco state': { name: 'San Francisco State University', shortName: 'SF State', location: 'San Francisco, California', state: 'CA', mascot: 'Gators', color: '#4F2683', est: 1899 },
  'clark atlanta': { name: 'Clark Atlanta University', shortName: 'Clark Atlanta', location: 'Atlanta, Georgia', state: 'GA', mascot: 'Panthers', color: '#CC0000', est: 1988 },
  'cal state long beach': { name: 'California State University, Long Beach', shortName: 'Long Beach State', location: 'Long Beach, California', state: 'CA', mascot: 'Sharks', color: '#000000', est: 1949 },
  'cal state east bay': { name: 'California State University, East Bay', shortName: 'Cal State East Bay', location: 'Hayward, California', state: 'CA', mascot: 'Pioneers', color: '#CC0000', est: 1957 },
  'utah valley': { name: 'Utah Valley University', shortName: 'Utah Valley', location: 'Orem, Utah', state: 'UT', mascot: 'Wolverines', color: '#275D38', est: 1941 },
  'utah tech': { name: 'Utah Tech University', shortName: 'Utah Tech', location: 'St. George, Utah', state: 'UT', mascot: 'Trailblazers', color: '#BA0C2F', est: 1911 },
  'cal state chico': { name: 'California State University, Chico', shortName: 'Chico State', location: 'Chico, California', state: 'CA', mascot: 'Wildcats', color: '#9D2235', est: 1887 },
  'csu fort collins': { name: 'Colorado State University', shortName: 'CSU Fort Collins', location: 'Fort Collins, Colorado', state: 'CO', mascot: 'Rams', color: '#1E4D2B', est: 1870 },
  'florida a&m': { name: 'Florida A&M University', shortName: 'FAMU', location: 'Tallahassee, Florida', state: 'FL', mascot: 'Rattlers', color: '#F26A36', est: 1887 },
  'los medanos': { name: 'Los Medanos College', shortName: 'Los Medanos', location: 'Pittsburg, California', state: 'CA', mascot: 'Mustangs', color: '#862633', est: 1974 },
  'northern iowa': { name: 'University of Northern Iowa', shortName: 'Northern Iowa', location: 'Cedar Falls, Iowa', state: 'IA', mascot: 'Panthers', color: '#4B116F', est: 1876 },
  'uw oshkosh': { name: 'University of Wisconsin-Oshkosh', shortName: 'UW-Oshkosh', location: 'Oshkosh, Wisconsin', state: 'WI', mascot: 'Titans', color: '#FFB81C', est: 1871 },
  'howard': { name: 'Howard University', shortName: 'Howard', location: 'Washington, District of Columbia', state: 'DC', mascot: 'Bison', color: '#002D62', est: 1867 },
  'fiu': { name: 'Florida International University', shortName: 'FIU', location: 'Miami, Florida', state: 'FL', mascot: 'Panthers', color: '#081E3F', est: 1965 },
  'emerson': { name: 'Emerson College', shortName: 'Emerson', location: 'Boston, Massachusetts', state: 'MA', mascot: 'Lions', color: '#582C83', est: 1880 },
  'wvu': { name: 'West Virginia University', shortName: 'WVU', location: 'Morgantown, West Virginia', state: 'WV', mascot: 'Mountaineers', color: '#002855', est: 1867 },
  'eastern kentucky': { name: 'Eastern Kentucky University', shortName: 'EKU', location: 'Richmond, Kentucky', state: 'KY', mascot: 'Colonels', color: '#4C121A', est: 1906 },
  'old dominion': { name: 'Old Dominion University', shortName: 'Old Dominion', location: 'Norfolk, Virginia', state: 'VA', mascot: 'Monarchs', color: '#003057', est: 1930 },
  'christopher newport': { name: 'Christopher Newport University', shortName: 'CNU', location: 'Newport News, Virginia', state: 'VA', mascot: 'Captains', color: '#003366', est: 1961 },
  'catholic university': { name: 'Catholic University of America', shortName: 'Catholic University', location: 'Washington, District of Columbia', state: 'DC', mascot: 'Cardinals', color: '#BA0C2F', est: 1887 },
  'vcu': { name: 'Virginia Commonwealth University', shortName: 'VCU', location: 'Richmond, Virginia', state: 'VA', mascot: 'Rams', color: '#000000', est: 1838 },
  'marymount': { name: 'Marymount University', shortName: 'Marymount', location: 'Arlington, Virginia', state: 'VA', mascot: 'Saints', color: '#002855', est: 1950 },
  'parsons': { name: 'Parsons School of Design', shortName: 'Parsons', location: 'New York, New York', state: 'NY', mascot: 'Designers', color: '#E82C2A', est: 1896 },
  'washington state': { name: 'Washington State University', shortName: 'WSU', location: 'Pullman, Washington', state: 'WA', mascot: 'Cougars', color: '#981E32', est: 1890 },
  'suny oswego': { name: 'SUNY Oswego', shortName: 'Oswego', location: 'Oswego, New York', state: 'NY', mascot: 'Lakers', color: '#00553A', est: 1861 },
  'louisville': { name: 'University of Louisville', shortName: 'Louisville', location: 'Louisville, Kentucky', state: 'KY', mascot: 'Cardinals', color: '#AD0000', est: 1798 },
  'louisiana': { name: 'University of Louisiana at Lafayette', shortName: 'Louisiana', location: 'Lafayette, Louisiana', state: 'LA', mascot: 'Ragin Cajuns', color: '#CE181E', est: 1898 },
  'butler': { name: 'Butler University', shortName: 'Butler', location: 'Indianapolis, Indiana', state: 'IN', mascot: 'Bulldogs', color: '#0C2340', est: 1855 },
  'wellesley': { name: 'Wellesley College', shortName: 'Wellesley', location: 'Wellesley, Massachusetts', state: 'MA', mascot: 'Blue', color: '#002B66', est: 1870 },
  'hartford': { name: 'University of Hartford', shortName: 'Hartford', location: 'West Hartford, Connecticut', state: 'CT', mascot: 'Hawks', color: '#C41230', est: 1877 },
  'trinity': { name: 'Trinity College', shortName: 'Trinity CT', location: 'Hartford, Connecticut', state: 'CT', mascot: 'Bantams', color: '#002D62', est: 1823 },
  'suffolk': { name: 'Suffolk University', shortName: 'Suffolk', location: 'Boston, Massachusetts', state: 'MA', mascot: 'Rams', color: '#002B49', est: 1906 },
  'southern connecticut': { name: 'Southern Connecticut State University', shortName: 'SCSU', location: 'New Haven, Connecticut', state: 'CT', mascot: 'Owls', color: '#003366', est: 1893 },
  'siena': { name: 'Siena College', shortName: 'Siena', location: 'Loudonville, New York', state: 'NY', mascot: 'Saints', color: '#00533E', est: 1937 },
  'michigan tech': { name: 'Michigan Technological University', shortName: 'Michigan Tech', location: 'Houghton, Michigan', state: 'MI', mascot: 'Huskies', color: '#FFCD00', est: 1885 },
  'hampton': { name: 'Hampton University', shortName: 'Hampton', location: 'Hampton, Virginia', state: 'VA', mascot: 'Pirates', color: '#00205B', est: 1868 },
  'hawaii pacific': { name: 'Hawaii Pacific University', shortName: 'Hawaii Pacific', location: 'Honolulu, Hawaii', state: 'HI', mascot: 'Sharks', color: '#007A87', est: 1965 },
  'new mexico': { name: 'University of New Mexico', shortName: 'UNM', location: 'Albuquerque, New Mexico', state: 'NM', mascot: 'Lobos', color: '#BA0C2F', est: 1889 },
  'fresno state': { name: 'California State University, Fresno', shortName: 'Fresno State', location: 'Fresno, California', state: 'CA', mascot: 'Bulldogs', color: '#CC0000', est: 1911 },
  'rhode island': { name: 'University of Rhode Island', shortName: 'URI', location: 'Kingston, Rhode Island', state: 'RI', mascot: 'Rams', color: '#002147', est: 1892 },
  'longwood': { name: 'Longwood University', shortName: 'Longwood', location: 'Farmville, Virginia', state: 'VA', mascot: 'Lancers', color: '#002D62', est: 1839 },
  'ut chattanooga': { name: 'University of Tennessee at Chattanooga', shortName: 'UTC', location: 'Chattanooga, Tennessee', state: 'TN', mascot: 'Mocs', color: '#002D62', est: 1886 },
  'yale': { name: 'Yale University', shortName: 'Yale', location: 'New Haven, Connecticut', state: 'CT', mascot: 'Bulldogs', color: '#00356B', est: 1701 },
  'seattle': { name: 'Seattle University', shortName: 'Seattle U', location: 'Seattle, Washington', state: 'WA', mascot: 'Redhawks', color: '#AA0000', est: 1891 },
  'nc central': { name: 'North Carolina Central University', shortName: 'NC Central', location: 'Durham, North Carolina', state: 'NC', mascot: 'Eagles', color: '#800000', est: 1910 },
  'sacramento state': { name: 'California State University, Sacramento', shortName: 'Sac State', location: 'Sacramento, California', state: 'CA', mascot: 'Hornets', color: '#043927', est: 1947 },
  'oakland': { name: 'Oakland University', shortName: 'Oakland', location: 'Rochester, Michigan', state: 'MI', mascot: 'Golden Grizzlies', color: '#85714D', est: 1957 },
  'houston': { name: 'University of Houston', shortName: 'Houston', location: 'Houston, Texas', state: 'TX', mascot: 'Cougars', color: '#C8102E', est: 1927 },
  'belmont': { name: 'Belmont University', shortName: 'Belmont', location: 'Nashville, Tennessee', state: 'TN', mascot: 'Bruins', color: '#002D62', est: 1890 },
  'cincinnati': { name: 'University of Cincinnati', shortName: 'Cincinnati', location: 'Cincinnati, Ohio', state: 'OH', mascot: 'Bearcats', color: '#E00122', est: 1819 },
  'lindsey wilson': { name: 'Lindsey Wilson College', shortName: 'Lindsey Wilson', location: 'Columbia, Kentucky', state: 'KY', mascot: 'Blue Raiders', color: '#002B49', est: 1903 },
  'wichita state': { name: 'Wichita State University', shortName: 'Wichita State', location: 'Wichita, Kansas', state: 'KS', mascot: 'Shockers', color: '#FFC82D', est: 1895 },
  'akron': { name: 'University of Akron', shortName: 'Akron', location: 'Akron, Ohio', state: 'OH', mascot: 'Zips', color: '#041E42', est: 1870 },
  'virginia wesleyan': { name: 'Virginia Wesleyan University', shortName: 'Virginia Wesleyan', location: 'Virginia Beach, Virginia', state: 'VA', mascot: 'Marlins', color: '#002D62', est: 1961 },
  'buffalo': { name: 'University at Buffalo', shortName: 'UB Buffalo', location: 'Buffalo, New York', state: 'NY', mascot: 'Bulls', color: '#005BBB', est: 1846 },
  'southern utah': { name: 'Southern Utah University', shortName: 'Southern Utah', location: 'Cedar City, Utah', state: 'UT', mascot: 'Thunderbirds', color: '#C41230', est: 1897 },
  'western michigan': { name: 'Western Michigan University', shortName: 'Western Michigan', location: 'Kalamazoo, Michigan', state: 'MI', mascot: 'Broncos', color: '#6C4023', est: 1903 },
  'alabama a&m': { name: 'Alabama A&M University', shortName: 'Alabama A&M', location: 'Normal, Alabama', state: 'AL', mascot: 'Bulldogs', color: '#660000', est: 1875 },
  'barry': { name: 'Barry University', shortName: 'Barry', location: 'Miami Shores, Florida', state: 'FL', mascot: 'Buccaneers', color: '#C41230', est: 1940 },
  'georgia college': { name: 'Georgia College & State University', shortName: 'Georgia College', location: 'Milledgeville, Georgia', state: 'GA', mascot: 'Bobcats', color: '#002855', est: 1889 },
  'george mason': { name: 'George Mason University', shortName: 'George Mason', location: 'Fairfax, Virginia', state: 'VA', mascot: 'Patriots', color: '#006633', est: 1972 },
  'wheaton': { name: 'Wheaton College', shortName: 'Wheaton', location: 'Wheaton, Illinois', state: 'IL', mascot: 'Thunder', color: '#002B49', est: 1860 },
  'kent state': { name: 'Kent State University', shortName: 'Kent State', location: 'Kent, Ohio', state: 'OH', mascot: 'Golden Flashes', color: '#002664', est: 1910 }
};

// State code helper
const STATE_NAMES = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD', 'massachusetts': 'MA',
  'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO', 'montana': 'MT',
  'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM',
  'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC'
};

// Helper to find matching existing school
function findExistingSchool(rawName) {
  const norm = normalizeName(rawName);
  // Try exact match on slug or id
  for (const s of existingSchools) {
    if (s.id === norm || s.slug === norm) return s;
    if (normalizeName(s.name) === norm || normalizeName(s.shortName) === norm) return s;
  }
  // Try substring / alias match
  for (const s of existingSchools) {
    const sNorm = normalizeName(s.name);
    const sShortNorm = normalizeName(s.shortName);
    if (norm.length >= 4 && (sNorm.includes(norm) || norm.includes(sNorm))) return s;
    if (sShortNorm.length >= 3 && (norm.startsWith(sShortNorm) || norm.includes(sShortNorm))) return s;
  }
  return null;
}

// Track updated vs added
let updatedCount = 0;
let addedCount = 0;
const existingIds = new Set(existingSchools.map(s => s.id));

// Process each unique entry from the user's list
for (const [key, item] of userSchoolsMap.entries()) {
  const existing = findExistingSchool(item.rawName);
  if (existing) {
    // DO NOT REPLICATE: Just update IG handle
    existing.instagramHandle = item.handle;
    updatedCount++;
  } else {
    // Must add new school
    // Find metadata or generate fallback
    let meta = null;
    for (const [mKey, mVal] of Object.entries(METADATA)) {
      if (key.includes(normalizeName(mKey)) || normalizeName(mKey).includes(key)) {
        meta = mVal;
        break;
      }
    }

    // Clean slug
    let baseSlug = key.slice(0, 16);
    let slug = baseSlug;
    let counter = 1;
    while (existingIds.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    existingIds.add(slug);

    const name = meta ? meta.name : (item.rawName.charAt(0) + item.rawName.slice(1).toLowerCase());
    const shortName = meta ? meta.shortName : (item.rawName.length > 15 ? item.rawName.slice(0, 12) : item.rawName);
    const location = meta ? meta.location : 'United States';
    const state = meta ? meta.state : 'US';
    const mascot = meta ? meta.mascot : 'Classmates';
    const accentColor = meta ? meta.color : '#002D62';
    const established = meta ? meta.est : 1950;
    const memberCount = Math.floor(650 + Math.random() * 1200);

    const newSchool = {
      id: slug,
      slug: slug,
      name,
      shortName,
      location,
      state,
      mascot,
      accentColor,
      badgeBg: 'bg-neutral-900',
      badgeText: 'text-neutral-100',
      bannerBg: 'from-neutral-950 via-slate-900 to-indigo-950',
      memberCount,
      established,
      instagramHandle: item.handle
    };

    existingSchools.push(newSchool);
    addedCount++;
  }
}

console.log(`Summary: Updated ${updatedCount} existing schools, Added ${addedCount} new schools. Total schools now: ${existingSchools.length}`);

// Write back to schoolsData.ts
const formattedSchools = existingSchools.map(s => {
  return `  {
    id: ${JSON.stringify(s.id)},
    slug: ${JSON.stringify(s.slug || s.id)},
    name: ${JSON.stringify(s.name)},
    shortName: ${JSON.stringify(s.shortName)},
    location: ${JSON.stringify(s.location)},
    state: ${JSON.stringify(s.state)},
    mascot: ${JSON.stringify(s.mascot)},
    accentColor: ${JSON.stringify(s.accentColor)},
    badgeBg: ${JSON.stringify(s.badgeBg || 'bg-neutral-900')},
    badgeText: ${JSON.stringify(s.badgeText || 'text-neutral-100')},
    bannerBg: ${JSON.stringify(s.bannerBg || 'from-neutral-950 via-slate-900 to-indigo-950')},
    memberCount: ${s.memberCount},
    established: ${s.established},
    instagramHandle: ${JSON.stringify(s.instagramHandle || 'no username')},
  }`;
}).join(',\n');

const newSchoolsDataContent = `import { School, Profile } from '../types';

export const INITIAL_SCHOOLS: School[] = [
${formattedSchools}
];

${profilesAndRest}`;

fs.writeFileSync('src/data/schoolsData.ts', newSchoolsDataContent, 'utf8');
console.log('Successfully wrote updated src/data/schoolsData.ts');
