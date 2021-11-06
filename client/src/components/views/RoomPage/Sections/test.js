import useSound from 'hooks/useSound';
import effectSound from 'utils/effectSound';
import BGM from 'audios/BGM.mp3';
import ES from 'audios/ES.mp3';

const Component = () => {
    // BGM 재생
    useSound(BGM, 1, 2000);
  
    // 효과음 할당
    // 재생이 필요한 시점에 es.play();
    const es = effectSound(ES, 1); 
}